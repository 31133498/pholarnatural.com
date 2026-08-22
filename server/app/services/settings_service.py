from typing import Dict

from sqlalchemy.orm import Session

from app.models.system import AdminSetting


def get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.query(AdminSetting).filter(AdminSetting.key == key).first()
    return row.value if row else default


def upsert_settings(db: Session, updates: Dict[str, str]) -> None:
    existing = {
        r.key: r
        for r in db.query(AdminSetting).filter(AdminSetting.key.in_(updates.keys())).all()
    }
    for key, value in updates.items():
        if key in existing:
            existing[key].value = value
        else:
            db.add(AdminSetting(key=key, value=value))
    db.commit()


def get_all_settings(db: Session) -> Dict[str, str]:
    return {r.key: r.value for r in db.query(AdminSetting).all()}
