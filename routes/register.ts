import express, { query, Request, Response } from "express";
import User from "../models/User";
import { HydratedDocument } from "mongoose";
import { UserInterface } from "../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { signinValidator } from "../validations/validators";
const router = express.Router();

async function generateJwt(user: HydratedDocument<UserInterface>) {
	console.log("signin token");
	return jwt.sign(
		{
			data: {
				email: user.email,
				id: user._id,
			},
		},
		"MONIB JAN",
		{ expiresIn: "1h" }
	);
}

router.post("/signin", async (req: Request, res: Response) => {
	const { errors, isValid } = signinValidator(req.body);
	console.log("xxxxxxxx", errors);
	console.log("valid", isValid());
	if (!isValid()) {
		console.log("NOT VALID XXX", errors);
		return res.status(422).json(errors);
	}
	console.log("login route");
	console.log("login ", req.body);
	const { email, password } = req.body;
	try {
		const user: HydratedDocument<UserInterface> | null = await User.findOne({
			email: email,
		});

		if (user) {
			const matched = await bcrypt.compare(password, user.password);
			if (matched) {
				console.log("password matched", matched);

				let token = await generateJwt(user);
				res.status(200).json({ token: token });
			} else {
				throw "wrong credentials";
			}
		} else {
			throw "Not Registered";
		}
	} catch (error) {
		console.log("ERROR backedn", error);
		res.status(400).json(error);
	}
});

router.put("/:id", (req: Request, res: Response) => {
	console.log("updating user data");
});

router.post("/signup", async (req: Request, res: Response) => {
	console.log("sign up route", req.body);
	const { email, firstName, lastName, password } = req.body;
	try {
		let user: HydratedDocument<UserInterface> | null = await User.findOne({
			email: email,
		});
		if (user) {
			throw "User already registered";
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);
		let newUser: HydratedDocument<UserInterface> = await new User({
			...req.body,
			password: hashedPassword,
		});
		const savedUser = await newUser.save();
		const token = await generateJwt(newUser);
		res.status(200).json({ token: token, user: savedUser });
	} catch (error) {
		console.log("XXXX", error);
		res.status(409).json(error);
	}
});

router.get("/search", (req, res) => {
	console.log("performing search");
	console.log("Query", req.query);

	res.status(200).json("searching");
});
export default router;
