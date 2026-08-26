import base64
import hashlib
import json
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

import jwt as pyjwt
from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Query,
    Response,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src import models, schemas
from src.database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

router = APIRouter(prefix="/api/v1")
bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _db_now() -> datetime:
    """Naive UTC datetime, safe for SQLite DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "item"


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    iterations = 210_000
    key = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )
    return (
        f"pbkdf2_sha256${iterations}"
        f"${base64.urlsafe_b64encode(salt).decode()}"
        f"${base64.urlsafe_b64encode(key).decode()}"
    )


def _verify_password(password: str, stored: str) -> bool:
    try:
        method, iterations_str, salt_b64, key_b64 = stored.split("$", 3)
        if method != "pbkdf2_sha256":
            return False
        iterations = int(iterations_str)
        
        # === FIX DEFENSIVO DE PADDING BASE64 ===
        salt_b64 += "=" * (-len(salt_b64) % 4)
        key_b64 += "=" * (-len(key_b64) % 4)
        # ========================================
        
        salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
        expected = base64.urlsafe_b64decode(key_b64.encode("ascii"))
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, iterations
        )
        return secrets.compare_digest(actual, expected)
    except Exception:
        return False


def _hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _create_access_token(user: models.User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _create_refresh_token(user: models.User, db: AsyncSession) -> str:
    raw_token = secrets.token_urlsafe(48)
    db.add(
        models.RefreshToken(
            user_id=user.id,
            token_hash=_hash_refresh_token(raw_token),
            expires_at=_db_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    return raw_token


async def _issue_tokens(
    user: models.User, db: AsyncSession
) -> schemas.TokenPair:
    refresh_token = _create_refresh_token(user, db)
    access_token = _create_access_token(user)
    await db.commit()
    return schemas.TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
async def _get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        bearer_scheme
    ),
    db: AsyncSession = Depends(get_db),
) -> Optional[models.User]:
    if credentials is None:
        return None

    try:
        payload = pyjwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = int(payload["sub"])
    except (pyjwt.PyJWTError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user = await db.get(models.User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_current_user(
    user: Optional[models.User] = Depends(_get_optional_user),
) -> models.User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


async def get_current_admin(
    user: models.User = Depends(get_current_user),
) -> models.User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


# ---------------------------------------------------------------------------
# Cart helpers
# ---------------------------------------------------------------------------
def _resolve_cart_identity(
    user: Optional[models.User],
    x_session_id: Optional[str],
) -> Tuple[Optional[int], Optional[str]]:
    if user is not None:
        return user.id, None
    if not x_session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Session-ID header is required for guest cart",
        )
    return None, x_session_id


async def _get_cart_items_for(
    user_id: Optional[int],
    session_id: Optional[str],
    db: AsyncSession,
) -> List[models.CartItem]:
    stmt = select(models.CartItem).options(
        selectinload(models.CartItem.product)
    )
    if user_id is not None:
        stmt = stmt.where(models.CartItem.user_id == user_id)
    else:
        stmt = stmt.where(models.CartItem.session_id == session_id)
    result = await db.scalars(stmt)
    return list(result.all())


async def _get_cart_item_or_404(
    item_id: int,
    user_id: Optional[int],
    session_id: Optional[str],
    db: AsyncSession,
) -> models.CartItem:
    stmt = (
        select(models.CartItem)
        .options(selectinload(models.CartItem.product))
        .where(models.CartItem.id == item_id)
    )
    item = await db.scalar(stmt)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    if user_id is not None:
        if item.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )
    elif item.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    return item


def _cart_item_response(item: models.CartItem) -> schemas.CartItemResponse:
    return schemas.CartItemResponse(
        id=item.id,
        product_id=item.product_id,
        quantity=item.quantity,
        product=schemas.ProductResponse.model_validate(item.product),
    )


def _build_cart_response(
    items: List[models.CartItem],
) -> schemas.CartResponse:
    item_responses: List[schemas.CartItemResponse] = []
    total = 0.0
    items_count = 0

    for item in items:
        if item.product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} no longer exists",
            )
        item_responses.append(_cart_item_response(item))
        total += item.product.price * item.quantity
        items_count += item.quantity

    return schemas.CartResponse(
        items=item_responses,
        total=round(total, 2),
        items_count=items_count,
    )


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@router.post(
    "/auth/register",
    response_model=schemas.TokenPair,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
)
async def register(
    payload: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
):
    email = payload.email.lower()
    existing = await db.scalar(
        select(models.User).where(models.User.email == email)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # === TRUCO PARA CREAR ADMIN EN LA NUBE ===
    user_role = "admin" if email == "admin@nube.com" else "cliente"
    # ==========================================

    user = models.User(
        email=email,
        password_hash=_hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=user_role,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    return await _issue_tokens(user, db)


@router.post("/auth/login", response_model=schemas.TokenPair, tags=["Auth"])
async def login(
    payload: schemas.UserLogin,
    db: AsyncSession = Depends(get_db),
):
    email = payload.email.lower()
    user = await db.scalar(
        select(models.User).where(models.User.email == email)
    )

    if user is None or not _verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return await _issue_tokens(user, db)


@router.post("/auth/refresh", response_model=schemas.TokenPair, tags=["Auth"])
async def refresh(
    payload: schemas.RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = _hash_refresh_token(payload.refresh_token)
    token = await db.scalar(
        select(models.RefreshToken)
        .options(selectinload(models.RefreshToken.user))
        .where(models.RefreshToken.token_hash == token_hash)
    )

    if (
        token is None
        or token.revoked_at is not None
        or token.expires_at <= _db_now()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = token.user
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    token.revoked_at = _db_now()
    await db.flush()
    return await _issue_tokens(user, db)


@router.post(
    "/auth/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Auth"],
)
async def logout(
    payload: schemas.LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    token_hash = _hash_refresh_token(payload.refresh_token)
    token = await db.scalar(
        select(models.RefreshToken).where(
            models.RefreshToken.token_hash == token_hash
        )
    )
    if token is not None and token.revoked_at is None:
        token.revoked_at = _db_now()
        await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
@router.get("/users/me", response_model=schemas.UserResponse, tags=["Users"])
async def read_me(user: models.User = Depends(get_current_user)):
    return user


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
@router.get(
    "/categories",
    response_model=List[schemas.CategoryResponse],
    tags=["Categories"],
)
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(
        select(models.Category).order_by(models.Category.name)
    )
    return list(result.all())


@router.post(
    "/categories",
    response_model=schemas.CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Categories"],
)
async def create_category(
    payload: schemas.CategoryCreate,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    category = models.Category(
        name=payload.name.strip(),
        slug=payload.slug or _slugify(payload.name),
    )
    db.add(category)
    try:
        await db.commit()
        await db.refresh(category)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category slug already exists",
        )
    return category


@router.get(
    "/categories/{category_slug}",
    response_model=schemas.CategoryDetailResponse,
    tags=["Categories"],
)
async def get_category(
    category_slug: str,
    db: AsyncSession = Depends(get_db),
):
    category = await db.scalar(
        select(models.Category)
        .options(selectinload(models.Category.products))
        .where(models.Category.slug == category_slug)
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return category


@router.patch(
    "/categories/{category_slug}",
    response_model=schemas.CategoryResponse,
    tags=["Categories"],
)
async def update_category(
    category_slug: str,
    payload: schemas.CategoryUpdate,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    category = await db.scalar(
        select(models.Category).where(models.Category.slug == category_slug)
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    data = payload.model_dump(exclude_unset=True)
    if data.get("name") is not None:
        category.name = data["name"].strip()
    if data.get("slug") is not None:
        category.slug = data["slug"]

    try:
        await db.commit()
        await db.refresh(category)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category slug already exists",
        )
    return category


@router.delete(
    "/categories/{category_slug}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Categories"],
)
async def delete_category(
    category_slug: str,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    category = await db.scalar(
        select(models.Category).where(models.Category.slug == category_slug)
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    product_count = await db.scalar(
        select(func.count())
        .select_from(models.Product)
        .where(models.Product.category_id == category.id)
    )
    if product_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category has associated products",
        )

    await db.delete(category)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
@router.get(
    "/products",
    response_model=List[schemas.ProductResponse],
    tags=["Products"],
)
async def list_products(
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, min_length=1),
    featured: Optional[bool] = Query(default=None),
    is_active: Optional[bool] = Query(default=True),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(models.Product)
        .join(models.Category, models.Product.category_id == models.Category.id)
        .order_by(models.Product.created_at.desc())
    )

    if category:
        stmt = stmt.where(models.Category.slug == category)
    if q:
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            models.Product.name.ilike(like)
            | models.Product.description.ilike(like)
        )
    if featured is not None:
        stmt = stmt.where(models.Product.is_featured == featured)
    if is_active is not None:
        stmt = stmt.where(models.Product.is_active == is_active)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.scalars(stmt)
    return list(result.all())


@router.post(
    "/products",
    response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Products"],
)
async def create_product(
    payload: schemas.ProductCreate,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    category = await db.get(models.Category, payload.category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="category_id does not exist",
        )

    product = models.Product(
        name=payload.name.strip(),
        slug=payload.slug or _slugify(payload.name),
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
        category_id=payload.category_id,
        images=json.dumps(payload.images or []),
        is_active=payload.is_active,
        is_featured=payload.is_featured,
    )
    db.add(product)

    try:
        await db.commit()
        await db.refresh(product)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug already exists",
        )
    return product


@router.get(
    "/products/{product_slug}",
    response_model=schemas.ProductResponse,
    tags=["Products"],
)
async def get_product(
    product_slug: str,
    db: AsyncSession = Depends(get_db),
):
    product = await db.scalar(
        select(models.Product).where(models.Product.slug == product_slug)
    )
    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.patch(
    "/products/{product_slug}",
    response_model=schemas.ProductResponse,
    tags=["Products"],
)
async def update_product(
    product_slug: str,
    payload: schemas.ProductUpdate,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    product = await db.scalar(
        select(models.Product).where(models.Product.slug == product_slug)
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    data = payload.model_dump(exclude_unset=True)

    if data.get("category_id") is not None:
        category = await db.get(models.Category, data["category_id"])
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="category_id does not exist",
            )
        product.category_id = data["category_id"]

    if "images" in data:
        product.images = json.dumps(data["images"] or [])

    for field in ("name", "description", "price", "stock", "is_active", "is_featured"):
        value = data.get(field)
        if value is not None:
            if field == "name":
                product.name = value.strip()
            else:
                setattr(product, field, value)

    if data.get("slug") is not None:
        product.slug = data["slug"]

    product.updated_at = _db_now()

    try:
        await db.commit()
        await db.refresh(product)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug already exists",
        )
    return product


@router.delete(
    "/products/{product_slug}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Products"],
)
async def delete_product(
    product_slug: str,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    product = await db.scalar(
        select(models.Product).where(models.Product.slug == product_slug)
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    product.is_active = False
    product.updated_at = _db_now()
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
@router.get("/cart", response_model=schemas.CartResponse, tags=["Cart"])
async def get_cart(
    user: Optional[models.User] = Depends(_get_optional_user),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_id = _resolve_cart_identity(user, x_session_id)
    items = await _get_cart_items_for(user_id, session_id, db)
    return _build_cart_response(items)


@router.post(
    "/cart/items",
    response_model=schemas.CartItemResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Cart"],
)
async def add_cart_item(
    payload: schemas.CartItemCreate,
    user: Optional[models.User] = Depends(_get_optional_user),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_id = _resolve_cart_identity(user, x_session_id)

    product = await db.get(models.Product, payload.product_id)
    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    stmt = select(models.CartItem).where(
        models.CartItem.product_id == payload.product_id
    )
    if user_id is not None:
        stmt = stmt.where(models.CartItem.user_id == user_id)
    else:
        stmt = stmt.where(models.CartItem.session_id == session_id)

    existing = await db.scalar(stmt)
    new_quantity = (existing.quantity if existing else 0) + payload.quantity

    if product.stock < new_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this product",
        )

    if existing:
        existing.quantity = new_quantity
        item = existing
    else:
        item = models.CartItem(
            user_id=user_id,
            session_id=session_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
        db.add(item)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cart item could not be added",
        )

    reloaded = await db.scalar(
        select(models.CartItem)
        .options(selectinload(models.CartItem.product))
        .where(models.CartItem.id == item.id)
    )
    if reloaded is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    return _cart_item_response(reloaded)


@router.patch(
    "/cart/items/{item_id}",
    response_model=schemas.CartItemResponse,
    tags=["Cart"],
)
async def update_cart_item(
    item_id: int,
    payload: schemas.CartItemUpdate,
    user: Optional[models.User] = Depends(_get_optional_user),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_id = _resolve_cart_identity(user, x_session_id)
    item = await _get_cart_item_or_404(item_id, user_id, session_id, db)

    product = item.product
    if product is None or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not available",
        )
    if product.stock < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this product",
        )

    item.quantity = payload.quantity
    await db.commit()

    reloaded = await db.scalar(
        select(models.CartItem)
        .options(selectinload(models.CartItem.product))
        .where(models.CartItem.id == item_id)
    )
    if reloaded is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )
    return _cart_item_response(reloaded)


@router.delete(
    "/cart/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Cart"],
)
async def remove_cart_item(
    item_id: int,
    user: Optional[models.User] = Depends(_get_optional_user),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_id = _resolve_cart_identity(user, x_session_id)
    item = await _get_cart_item_or_404(item_id, user_id, session_id, db)
    await db.delete(item)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/cart",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Cart"],
)
async def clear_cart(
    user: Optional[models.User] = Depends(_get_optional_user),
    x_session_id: Optional[str] = Header(default=None, alias="X-Session-ID"),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_id = _resolve_cart_identity(user, x_session_id)
    items = await _get_cart_items_for(user_id, session_id, db)
    for item in items:
        await db.delete(item)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
@router.post(
    "/orders",
    response_model=schemas.OrderResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Orders"],
)
async def create_order(
    payload: schemas.OrderCreate,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cart_items = await _get_cart_items_for(user.id, None, db)
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    subtotal = 0.0
    for cart_item in cart_items:
        product = cart_item.product
        if product is None or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {cart_item.product_id} is not available",
            )
        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}",
            )
        subtotal += product.price * cart_item.quantity

    subtotal = round(subtotal, 2)
    total = round(subtotal + payload.shipping_cost, 2)

    order = models.Order(
        user_id=user.id,
        status="pending",
        subtotal=subtotal,
        shipping_cost=payload.shipping_cost,
        total=total,
        shipping_address=json.dumps(payload.shipping_address, ensure_ascii=False),
    )
    db.add(order)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order could not be created",
        )

    for cart_item in cart_items:
        product = cart_item.product
        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name_snapshot=product.name,
                unit_price=product.price,
                quantity=cart_item.quantity,
                total=round(product.price * cart_item.quantity, 2),
            )
        )
        product.stock -= cart_item.quantity

    await db.flush()

    for cart_item in cart_items:
        await db.delete(cart_item)

    await db.commit()

    created = await db.scalar(
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == order.id)
    )
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return created


@router.get(
    "/orders",
    response_model=List[schemas.OrderResponse],
    tags=["Orders"],
)
async def list_orders(
    order_status: Optional[str] = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    allowed_statuses = {"pending", "paid", "shipped", "cancelled"}
    if order_status is not None and order_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status",
        )

    stmt = select(models.Order).options(selectinload(models.Order.items))
    if order_status:
        stmt = stmt.where(models.Order.status == order_status)
    stmt = stmt.order_by(models.Order.created_at.desc()).offset(skip).limit(limit)

    result = await db.scalars(stmt)
    return list(result.all())


@router.get(
    "/orders/me",
    response_model=List[schemas.OrderResponse],
    tags=["Orders"],
)
async def my_orders(
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
    )
    result = await db.scalars(stmt)
    return list(result.all())


@router.get(
    "/orders/{order_id}",
    response_model=schemas.OrderResponse,
    tags=["Orders"],
)
async def get_order(
    order_id: int,
    user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == order_id)
    )
    order = await db.scalar(stmt)

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return order


@router.patch(
    "/orders/{order_id}/status",
    response_model=schemas.OrderResponse,
    tags=["Orders"],
)
async def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    _admin: models.User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items))
        .where(models.Order.id == order_id)
    )
    order = await db.scalar(stmt)

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    order.status = payload.status
    if payload.status == "paid" and order.paid_at is None:
        order.paid_at = _db_now()

    await db.commit()

    reloaded = await db.scalar(stmt)
    if reloaded is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return reloaded