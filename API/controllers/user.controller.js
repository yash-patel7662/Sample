const APIError = require("../helpers/APIError");
const resPattern = require("../helpers/resPattern");
const httpStatus = require("http-status");
const db = require("../server");
const userColl = db.collection("user");
const moment = require("moment");
const { generatePassword } = require("../helpers/commonfile");
const { ObjectID } = require("mongodb");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
require("dotenv").config();

const createUser = async (req, res, next) => {
  try {
    if (req.body.firstName == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "FirstName is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    } else {
      const re = /^[A-Za-z\s]+$/;
      const check = re.test(String(req.body.firstName));
      if (check === false) {
        let obj = resPattern.successPattern(
          httpStatus.BAD_REQUEST,
          "Firstname must be alphabetic.",
          "BAD REQUEST"
        );
        return res.status(obj.code).json(obj);
      }
    }
    if (req.body.lastName == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "LastName is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    } else {
      const re = /^[A-Za-z\s]+$/;
      const check = re.test(String(req.body.lastName));
      if (check === false) {
        let obj = resPattern.successPattern(
          httpStatus.BAD_REQUEST,
          "Lastname must be alphabetic.",
          "BAD REQUEST"
        );
        return res.status(obj.code).json(obj);
      }
    }
    if (req.body.password == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "Password is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    } else {
      if (req.body.password.length < 6) {
        let obj = resPattern.successPattern(
          httpStatus.BAD_REQUEST,
          "Password should be atleast 6 characters",
          "BAD REQUEST"
        );
        return res.status(obj.code).json(obj);
      }
      if (req.body.password.length > 16) {
        let obj = resPattern.successPattern(
          httpStatus.BAD_REQUEST,
          "Password should be atmost 16 characters",
          "BAD REQUEST"
        );
        return res.status(obj.code).json(obj);
      }
    }
    if (req.body.email == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "Email is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    } else {
      const re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const check = re.test(String(req.body.email).toLowerCase());
      if (check === false) {
        let obj = resPattern.successPattern(
          httpStatus.BAD_REQUEST,
          "Email is invalid!!!",
          "BAD REQEEST"
        );
        return res.status(obj.code).json(obj);
      }
    }
    if (req.body.DOB == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "DOB is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    }
    if (req.body.hobbies == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "Hobbies is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    }
    if (req.body.gender == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "Gender is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    }
    const requestdata = { email: req.body.email };
    const userEmail = await userColl.findOne(requestdata);
    if (userEmail) {
      const message = `You have already registered with email`;
      const obj = resPattern.successPattern(httpStatus.BAD_REQUEST, message);
      return res.status(obj.code).json(obj);
    }
    const data = req.body;
    data.createdAt = moment().utc().format("YYYY-MM-DD hh:mm:ss");
    data.password = generatePassword(req.body.password);
    data.type = "User";

    const insertData = await userColl.insertOne(data);
    let obj = resPattern.successPattern(
      httpStatus.OK,
      insertData.ops[0],
      "Success"
    );
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
  }
};

const listAllUsers = async (req, res, next) => {
  try {
    let skip = parseInt(req.query.skip);
    let limit = parseInt(req.query.limit);
    let search = req.query.search;

    if (!search) {
      const userData = await userColl.find({ type: "User" }).toArray();
      const allUsers = await userColl
        .find({ type: "User" })
        .skip(skip)
        .limit(limit)
        .toArray();
      let obj = resPattern.successPattern(
        httpStatus.OK,
        { TotalCount: userData.length, Users: allUsers },
        "Success"
      );
      return res.status(obj.code).json(obj);
    } else {
      const userData = await userColl.find({ type: "User" }).toArray();
      const filter = {
        type: "User",
        $or: [
          { firstname: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      };
      const allUsers = await userColl
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();
      let obj = resPattern.successPattern(
        httpStatus.OK,
        { TotalCount: userData.length, Users: allUsers },
        "Success"
      );
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
  }
};

const editUser = async (req, res, next) => {
  try {
    const userId = ObjectID(req.params.id);
    const data = req.body;

    const userData = await userColl.find({ _id: userId }).toArray();
    if (userData.length === 0) {
      let obj = resPattern.successPattern(
        httpStatus.NOT_FOUND,
        "User Not Found!",
        "Not Found"
      );
      return res.status(obj.code).json(obj);
    }

    await userColl.findOneAndUpdate({ _id: userId }, { $set: data });
    let message = "Data Updated Successfully!!";
    let obj = resPattern.successPattern(httpStatus.OK, message, "Success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = ObjectID(req.params.id);
    const userData = await userColl.findOne({ _id: userId });

    if (!userData) {
      const message = `User Not Found`;
      let obj = resPattern.successPattern(httpStatus.BAD_REQUEST, message);
      return res.status(obj.code).json(obj);
    }

    await userColl.deleteOne({ _id: userId });
    const message = `User Deleted Successfuly`;
    let obj = resPattern.successPattern(httpStatus.OK, message, "Success");
    return res.status(obj.code).json(obj);
  } catch (e) {
    return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
  }
};

const login = async (req, res, next) => {
  try {
    if (req.body.email == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "Email is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    } else {
      const re =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      const check = re.test(String(req.body.email).toLowerCase());
      if (check === false) {
        let obj = resPattern.successPattern(
          httpStatus.BAD_REQUEST,
          "Email is invalid!!!",
          "BAD REQEEST"
        );
        return res.status(obj.code).json(obj);
      }
    }
    if (req.body.password == "") {
      let obj = resPattern.successPattern(
        httpStatus.BAD_REQUEST,
        "Password is required!!!",
        "BAD REQUEST"
      );
      return res.status(obj.code).json(obj);
    }
    const { password } = req.body;
    const requestdata = { email: req.body.email };
    const userData = await userColl.findOne(requestdata);

    if (!userData || userData.password == null) {
      const message = `Incorrect email or password.`;
      let obj = resPattern.successPattern(httpStatus.BAD_REQUEST, message);
      return res.status(obj.code).json(obj);
    }

    const isMatch = await bcrypt.compare(password, userData.password);
    if (isMatch) {
      const message = `Login SuccessFully`;
      const token = JWT.sign({ _id: userData._id }, process.env.JWT_SECRET);
      const type = userData.type;
      const email = req.body.email;
      const id = userData._id;
      let obj = resPattern.successPattern(
        httpStatus.OK,
        { message, token, id, type, email },
        "Success"
      );
      return res.status(obj.code).json(obj);
    } else {
      const message = `Password Incorrect`;
      let obj = resPattern.successPattern(httpStatus.BAD_REQUEST, message);
      return res.status(obj.code).json(obj);
    }
  } catch (e) {
    return next(new APIError(`${e.message}`, httpStatus.BAD_REQUEST, true));
  }
};

module.exports = {
  createUser,
  listAllUsers,
  editUser,
  deleteUser,
  login,
};
