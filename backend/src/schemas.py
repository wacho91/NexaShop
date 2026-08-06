import json
import re
from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Auth / Users
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=120)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("password must contain at least one letter and one number")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(ORMModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: Optional[str] = None

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        v = str(v).strip().lower()
        v = re.sub(r"\s+", "-", v)
        if not v:
            return None
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", v):
            raise ValueError("slug must contain only lowercase letters, numbers and hyphens")
        return v


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = None

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        v = str(v).strip().lower()
        v = re.sub(r"\s+", "-", v)
        if not v:
            return None
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", v):
            raise ValueError("slug must contain only lowercase letters, numbers and hyphens")
        return v


class CategoryResponse(ORMModel):
    id: int
    name: str
    slug: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = None
    description: str = ""
    price: float = Field(..., gt=0, le=1_000_000)
    stock: int = Field(0, ge=0, le=1_000_000)
    category_id: int = Field(..., gt=0)
    images: List[str] = Field(default_factory=list)
    is_active: bool = True
    is_featured: bool = False

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        v = str(v).strip().lower()
        v = re.sub(r"\s+", "-", v)
        if not v:
            return None
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", v):
            raise ValueError("slug must contain only lowercase letters, numbers and hyphens")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0, le=1_000_000)
    stock: Optional[int] = Field(None, ge=0, le=1_000_000)
    category_id: Optional[int] = Field(None, gt=0)
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        v = str(v).strip().lower()
        v = re.sub(r"\s+", "-", v)
        if not v:
            return None
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", v):
            raise ValueError("slug must contain only lowercase letters, numbers and hyphens")
        return v


class ProductResponse(ORMModel):
    id: int
    name: str
    slug: str
    description: str
    price: float
    stock: int
    category_id: int
    images: List[str]
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    @field_validator("images", mode="before")
    @classmethod
    def parse_images(cls, v: Any) -> List[str]:
        if v is None:
            return []
        if isinstance(v, str):
            try:
                data = json.loads(v)
                if isinstance(data, list):
                    return [str(x) for x in data]
            except json.JSONDecodeError:
                pass
            return []
        if isinstance(v, list):
            return [str(x) for x in v]
        return []


class CategoryDetailResponse(CategoryResponse):
    products: List[ProductResponse] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
class CartItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(1, ge=1, le=999)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, le=999)


class CartItemResponse(ORMModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float
    items_count: int


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
class OrderItemResponse(ORMModel):
    id: int
    order_id: int
    product_id: int
    product_name_snapshot: str
    unit_price: float
    quantity: int
    total: float


class OrderCreate(BaseModel):
    shipping_address: dict[str, Any]
    shipping_cost: float = Field(0, ge=0)

    @field_validator("shipping_address")
    @classmethod
    def validate_address(cls, v: Any) -> dict[str, Any]:
        if not isinstance(v, dict) or not v:
            raise ValueError("shipping_address must be a non-empty object")
        return v


class OrderResponse(ORMModel):
    id: int
    user_id: int
    status: str
    subtotal: float
    shipping_cost: float
    total: float
    shipping_address: dict[str, Any]
    created_at: datetime
    paid_at: Optional[datetime] = None
    items: List[OrderItemResponse] = Field(default_factory=list)

    @field_validator("shipping_address", mode="before")
    @classmethod
    def parse_address(cls, v: Any) -> dict[str, Any]:
        if isinstance(v, str):
            try:
                data = json.loads(v)
                if isinstance(data, dict):
                    return data
            except json.JSONDecodeError:
                pass
            return {}
        if isinstance(v, dict):
            return v
        return {}


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "paid", "shipped", "cancelled"]
