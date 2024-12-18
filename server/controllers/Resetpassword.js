const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const bcrypt = require("bcrypt")
const crypto = require("crypto")

exports.resetPasswordToken = async (req, res) => {
  try {
    const email = req.body.email
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
      })
    }
    const token = crypto.randomBytes(20).toString("hex")

    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 3600000,
      },
      { new: true }
    )
    console.log("DETAILS", updatedDetails)


    const url = `${process.env.FRONTEND_URL}/reset/${token}`

    const kk = await mailSender(
      email,
      "Password Reset",
      `Your Link for email verification is ${url}. Please click this url to reset your password.`
    )
    res.status(200).json({
      success: true,
      message: 'Email Sent Successfully. Please Check Your Email to Continue Further.',
    });
  } catch (error) {
    console.error('Error in sending reset message:', error);
    return res.status(500).json({
      success: false,
      message: 'Some Error in Sending the Reset Message. Please try again later.',
    });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    console.log(password);
    console.log(confirmPassword);
    console.log(req.params);
    if (confirmPassword !== password) {
      console.log(`Password and Confirm Password Does not Match`);
      return res.status(404).json({
        success: false,
        message: "Password and Confirm Password Does not Match",
      })
    }
    const userDetails = await User.findOne({ token: token })
    if (!userDetails) {
      console.log(`Token is Invalid`);
      return res.json({
        success: false,
        message: "Token is Invalid",
      })
    }
    if (!(userDetails.resetPasswordExpires > Date.now())) {
      console.log(`Token is Expired, Please Regenerate Your Token`);
      return res.status(403).json({
        success: false,
        message: `Token is Expired, Please Regenerate Your Token`,
      })
    }
    const encryptedPassword = await bcrypt.hash(password, 10)
    await User.findOneAndUpdate(
      { token: token },
      { password: encryptedPassword },
      { new: true }
    )
    console.log(`Password Reset Successful`);
    res.status(200).json({
      success: true,
      message: `Password Reset Successful`,
    })
  }
  catch (error) {
    console.log(`Some Error in Updating the Password`);
    return res.json({
      error: error.message,
      success: false,
      message: `Some Error in Updating the Password`,
    })
  }
}
