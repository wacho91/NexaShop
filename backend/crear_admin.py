import asyncio
import base64
import hashlib
import secrets
from sqlalchemy import select
from src.database import AsyncSessionLocal, init_db
from src.models import User

# Copiamos exactamente la función de hash que usa el backend de NexaShop
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

async def crear():
    # Aseguramos que las tablas existan en la base de datos
    await init_db()
   
    async with AsyncSessionLocal() as db:
        # 1. Verificar si ya existe el admin
        result = await db.execute(select(User).where(User.email == "admin@nexashop.com"))
        user = result.scalars().first()
       
        if not user:
            # 2. Hashear la contraseña con el algoritmo correcto del backend
            hashed_password = _hash_password("12345678")
           
            # 3. Crear el usuario Admin
            user = User(
                email="admin@nexashop.com",
                full_name="Cristian Admin",
                password_hash=hashed_password,
                role="admin",
                is_active=True
            )
            db.add(user)
            await db.commit()
            print("¡Usuario Admin creado con éxito (hash corregido)! Ya puedes iniciar sesión.")
        else:
            # Si ya existe, actualizamos su contraseña al hash correcto
            user.password_hash = _hash_password("12345678")
            await db.commit()
            print("¡El Admin ya existía, pero su contraseña fue actualizada al hash correcto!")

if __name__ == "__main__":
    asyncio.run(crear())