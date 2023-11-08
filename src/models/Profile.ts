import mongoose, { Schema } from 'mongoose'

const ProfileSchema: Schema = new Schema({ 
    user: {
        type: String,
        required: true
    },
    exp: Number,
    level: Number,
    totalExp: Number,
    rankCardColor: String
})

export default mongoose.model('profiles', ProfileSchema)