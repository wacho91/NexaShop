from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(collation="NOCASE"), unique=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(
        String, nullable=False, default="cliente", server_default=text("'cliente'")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("1")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )

    orders: Mapped[List["Order"]] = relationship(back_populates="user")
    cart_items: Mapped[List["CartItem"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(back_populates="user")

    __table_args__ = (
        CheckConstraint("role IN ('cliente', 'admin')", name="ck_users_role"),
        CheckConstraint("is_active IN (0, 1)", name="ck_users_is_active"),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(
        String(collation="NOCASE"), unique=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )

    products: Mapped[List["Product"]] = relationship(back_populates="category")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r}>"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(
        String(collation="NOCASE"), unique=True, nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=False, default="", server_default=text("''")
    )
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default=text("0")
    )
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False
    )
    images: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]", server_default=text("'[]'")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("1")
    )
    is_featured: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )

    category: Mapped["Category"] = relationship(back_populates="products")
    cart_items: Mapped[List["CartItem"]] = relationship(back_populates="product")
    order_items: Mapped[List["OrderItem"]] = relationship(back_populates="product")

    __table_args__ = (
        CheckConstraint("price > 0", name="ck_products_price"),
        CheckConstraint("stock >= 0", name="ck_products_stock"),
        CheckConstraint("json_valid(images)", name="ck_products_images"),
        CheckConstraint("is_active IN (0, 1)", name="ck_products_is_active"),
        CheckConstraint("is_featured IN (0, 1)", name="ck_products_is_featured"),
        Index("idx_products_category", "category_id"),
        Index("idx_products_active", "is_active"),
        Index("idx_products_featured", "is_featured"),
        Index("idx_products_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name!r}>"


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )

    user: Mapped[Optional["User"]] = relationship(back_populates="cart_items")
    product: Mapped["Product"] = relationship(back_populates="cart_items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_cart_items_quantity"),
        CheckConstraint(
            "(user_id IS NOT NULL OR session_id IS NOT NULL) "
            "AND (user_id IS NULL OR session_id IS NULL)",
            name="ck_cart_items_user_session",
        ),
        Index("idx_cart_user", "user_id"),
        Index("idx_cart_session", "session_id"),
        Index(
            "idx_cart_user_product",
            "user_id",
            "product_id",
            unique=True,
            sqlite_where=text("user_id IS NOT NULL"),
        ),
        Index(
            "idx_cart_session_product",
            "session_id",
            "product_id",
            unique=True,
            sqlite_where=text("session_id IS NOT NULL"),
        ),
    )

    def __repr__(self) -> str:
        return f"<CartItem id={self.id} product_id={self.product_id} quantity={self.quantity}>"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="pending", server_default=text("'pending'")
    )
    subtotal: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    shipping_cost: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    total: Mapped[float] = mapped_column(
        Float, nullable=False, default=0, server_default=text("0")
    )
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'paid', 'shipped', 'cancelled')",
            name="ck_orders_status",
        ),
        CheckConstraint("subtotal >= 0", name="ck_orders_subtotal"),
        CheckConstraint("shipping_cost >= 0", name="ck_orders_shipping_cost"),
        CheckConstraint("total >= 0", name="ck_orders_total"),
        CheckConstraint("json_valid(shipping_address)", name="ck_orders_shipping_address"),
        Index("idx_orders_user", "user_id"),
        Index("idx_orders_status", "status"),
        Index("idx_orders_created_at", "created_at"),
        Index("idx_orders_status_created", "status", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status!r}>"


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    product_name_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")

    __table_args__ = (
        CheckConstraint("unit_price >= 0", name="ck_order_items_unit_price"),
        CheckConstraint("quantity > 0", name="ck_order_items_quantity"),
        CheckConstraint("total >= 0", name="ck_order_items_total"),
        Index("idx_order_items_order", "order_id"),
        Index("idx_order_items_product", "product_id"),
    )

    def __repr__(self) -> str:
        return f"<OrderItem id={self.id} product_id={self.product_id} quantity={self.quantity}>"


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("(datetime('now'))")
    )
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")

    __table_args__ = (
        Index("idx_refresh_tokens_user", "user_id"),
        Index("idx_refresh_tokens_expires", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<RefreshToken id={self.id} user_id={self.user_id}>"
