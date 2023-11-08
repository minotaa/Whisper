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
  if (!profiles[0]) {
    let profile = new Profile({
      user: user,
      exp: 0,
      level: 0,
      totalExp: 0
    })
    profile.save()
    console.log(`Created a profile for ${kleur.green(user)}.`)
    return profile
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