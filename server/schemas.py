from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class Login(BaseModel):
    username: str
    password: str

class AddContact(BaseModel):
    contact_username: str

class EmergencyTextSend(BaseModel):
    receiver: str
    message: str

class EmergencyCallCreate(BaseModel):
    receiver: str
