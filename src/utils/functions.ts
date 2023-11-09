import kleur from "kleur"
import Profile from "../models/Profile"

export function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

export const getTopProfiles = async function () {
  let profiles = await Profile.find().exec()
  profiles.sort(function (a, b) { return (b.totalExp) - (a.totalExp) })
  return profiles
}

export const checkProfile = async function (user, bot = null) {
  let profiles = await Profile.find({
    user: user
  }).exec()
  if (profiles.length > 0) {
    return
  } else {
    let pro = new Profile({
      user: user,
      exp: 0,
      level: 0,
      totalExp: 0
    })
    pro.save()
    console.log(`Created a profile for ${kleur.green(user)}.`)
  }
}

export const getProfile = async function (user) {
  let result = await Profile.findOne({
    user: user
  })
  if (!result) {
    return null
  } else {
    return result
  }
}