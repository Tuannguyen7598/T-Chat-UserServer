import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { HydratedDocument } from "mongoose";
import { UserDto } from "../../type/user.interface";

export type UserDocument = HydratedDocument<UserDto>;

export const UserSchema = SchemaFactory.createForClass(UserDto);