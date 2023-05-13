import { Controller, Inject } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";

import { AuthService } from "./auth.service";
import { Model } from "mongoose";
import { UserDto, resulToGateWay } from "libs/share/model";
import { KeyToCommunicateUserServer, UserActonTypeAccount } from "libs/share/model";


@Controller()
export class AuthController {
  constructor(
    @Inject("USER_MODEL") private userModel: Model<UserDto>,
    @Inject("HASH_PASSWORD") private hassPassword,
    private readonly authService: AuthService) { }

  @MessagePattern(KeyToCommunicateUserServer.register)
  async register(@Payload() user: UserDto) {
    const findUser = await this.userModel.findOne({
      username: user.username
    })
    if (findUser) {
      return resulToGateWay(UserActonTypeAccount.registerFalse, user, [])
    }
    const saft = this.hassPassword.buySalt()
    const newUser = UserDto.createObj({
      username: user.username,
      credentials: {
        password: this.hassPassword.hashPassword(user.credentials.password, saft),
        salt: saft
      },
      role: user.role
    })
    const createUser = (await this.userModel.create(newUser)).toObject()
    if (createUser === null || createUser === undefined) {
      return resulToGateWay(UserActonTypeAccount.registerFalse, user, [])
    }
    return resulToGateWay(UserActonTypeAccount.registerSuccess, createUser, ['credentials'])
  }

  @MessagePattern(KeyToCommunicateUserServer.login)
  async login(@Payload() user: UserDto) {
    const checkUser = await this.userModel.findOne({
      username: user.username
    })
    if (checkUser === null || checkUser === undefined) {
      return resulToGateWay(UserActonTypeAccount.loginFalse, user, [])
    }
    const checkPassword = this.hassPassword.hashPassword(user.credentials.password, checkUser.credentials.salt) === checkUser.credentials.password

    if (!checkPassword) {
      return resulToGateWay(UserActonTypeAccount.loginFalse, user, [])
    }
    return resulToGateWay(UserActonTypeAccount.loginSuccess, checkUser.toObject(), ['credentials'])
  }

  @MessagePattern(KeyToCommunicateUserServer.settingAccount)
  async settingAccount(@Payload() user: UserDto) {
    const checkUser = await this.userModel.findOne({
      id: user.id
    }) 
    if (checkUser === null || checkUser === undefined) {
      return resulToGateWay(UserActonTypeAccount.settingAccountFalse, user, [])
    }
    const newSalt = this.hassPassword.buySalt()
    const newPassword = this.hassPassword.hashPassword(user.credentials.password,newSalt)
    const updateUser = await this.userModel.findOneAndUpdate({ id: checkUser.id }, {
      $set: {
        username: user.username ?? checkUser.username,
        'credentials.password': user.credentials.password !== null || user.credentials.password !== undefined ? newPassword : checkUser.credentials.password,
        'credentials.salt': user.credentials.salt!== null || user.credentials.password !== undefined ? newSalt : checkUser.credentials.salt
      }
    })
    if (!updateUser.toObject()) {
      return resulToGateWay(UserActonTypeAccount.settingAccountFalse,user,[])
    }
    return resulToGateWay(UserActonTypeAccount.settingAccountTrue,updateUser.toObject(),['credentials'])
  }
}