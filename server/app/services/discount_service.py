from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.order import Discount
from app.schemas.discount import DiscountCreate, DiscountUpdate

def get_all_discounts(db: Session):
    return db.query(Discount).all()

def create_discount(db: Session, discount_in: DiscountCreate):
    if db.query(Discount).filter(Discount.code == discount_in.code.upper()).first():
        raise HTTPException(status_code=400, detail="Discount code already exists.")
        
    db_discount = Discount(
        **discount_in.model_dump(exclude={'code'}),
        code=discount_in.code.upper() # Enforce uppercase codes
    )
    db.add(db_discount)
    db.commit()
    db.refresh(db_discount)
    return db_discount

def update_discount(db: Session, discount_id: int, discount_in: DiscountUpdate):
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")
        
    update_data = discount_in.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        update_data["code"] = update_data["code"].upper()
        
    for key, value in update_data.items():
        setattr(db_discount, key, value)
        
    db.commit()
    db.refresh(db_discount)
    return db_discount

def delete_discount(db: Session, discount_id: int):
    db_discount = db.query(Discount).filter(Discount.id == discount_id).first()
    if not db_discount:
        raise HTTPException(status_code=404, detail="Discount not found")
        
    db.delete(db_discount)
    db.commit()
    return {"message": "Discount deleted"}