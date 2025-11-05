from database import db
from Models.BaseModel import BaseModel

# from sqlalchemy import create_engine, Column, Integer, String
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.ext.declarative import declarative_base
#
# engine = create_engine('sqlite:///database.db')
# Session = sessionmaker(bind=engine)
# Base = declarative_base()


class AccessWeek(BaseModel):
    __tablename__ = 'access_week'

    id = db.Column(db.Integer, primary_key=True)
    serial = db.Column(db.String)
    name = db.Column(db.String)
    monday = db.Column(db.Integer)
    tuesday = db.Column(db.Integer)
    wednesday = db.Column(db.Integer)
    thursday = db.Column(db.Integer)
    friday = db.Column(db.Integer)
    saturday = db.Column(db.Integer)
    sunday = db.Column(db.Integer)


# 查询记录
def get_access_week_by_id(id):

    return db.session.query(AccessWeek).get(id)


# 删除记录
def delete_access_week(id):

    access_week = db.session.query(AccessWeek).get(id)
    if access_week:
        db.session.delete(access_week)
        db.session.commit()

    # 获取所有记录


def get_all_access_weeks():

    return db.session.query(AccessWeek).all()


# 插入记录
def insert_access_week(access_week):

    db.session.add(access_week)
    db.session.commit()


# 更新记录
def update_access_week(id, serial, name, monday, tuesday, wednesday, thursday, friday, saturday, sunday):

    access_week = db.session.query(AccessWeek).get(id)
    if access_week:
        access_week.serial = serial
        access_week.name = name
        access_week.monday = monday
        access_week.tuesday = tuesday
        access_week.wednesday = wednesday
        access_week.thursday = thursday
        access_week.friday = friday
        access_week.saturday = saturday
        access_week.sunday = sunday
        db.session.commit()
