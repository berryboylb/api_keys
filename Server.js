const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 4000;
const { createUser, authenticateKey, genAPIKey } = require("./apiAuth");
const { userSchema, countrySchema, emailSchema } = require("./validation");
const User = require("./models/User");
const Country = require("./models/Country");
const connectDB = require("./db");
app.use(cors());
require("dotenv").config();

connectDB();

//handle json body request
app.use(express.json({ extended: false }));

app.get("/", (req, res) => {
  //home page
  res.status(200).send({
    data: { message: "You can get list of countires at /api/country." },
  });
});

app.post("/api/register", async (req, res) => {
  //create a new with "user:Username"
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        code: 400,
        message: error.details[0].message,
      },
    });
  }

  // return res.status(201).send({ message: "Success", data: req.body });

  try {
    const newUser = await User.findOne({ email: req.body.email });
    if (newUser) {
      return res.status(400).json({
        error: {
          code: 400,
          message: "User already exists",
        },
      });
    }
    const user = await createUser(req.body, req);
    res.status(201).send({ message: "Success", data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: {
        code: 500,
        message: "An internal server occured",
      },
    });
  }
});

app.get("/api/country", authenticateKey, async (req, res) => {
  //   //get list of all Countries
  //   let today = new Date().toISOString().split("T")[0];
  //   console.log(today);
  //   res.status(200).send({
  //     data: Countries,
  //   });
  try {
    const countries = await Country.find().sort({ date: -1 });
    if (countries.length === 0)
      return res.status(400).json({
        error: {
          code: 400,
          message: "Empty Countries",
        },
      });
    if (!countries)
      return res.status(404).json({
        error: {
          code: 400,
          message: "Posts not found",
        },
      });
    res.status(201).send({ message: "Success", data: posts });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: {
        code: 500,
        message: "An internal server occured",
      },
    });
  }
});

app.get("/api/user", authenticateKey, async (req, res) => {
  try {
    //.select('-password') stops the password from being returned
    const user = await User.find({ api_key: req.header("x-api-key") }).select(
      "-api_key"
    );
    res.status(201).send({ message: "Success", data: user });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: {
        code: 500,
        message: "An internal server occured",
      },
    });
  }
});

app.post("/api/country", authenticateKey, async (req, res) => {
  //add a new country
  const { error } = countrySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: {
        code: 400,
        message: error.details[0].message,
      },
    });
  }

  try {
    let country = new Country({
      name: req.body.name,
    });
    await country.save();
    res.status(201).send({ message: "Success", data: country });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: {
        code: 500,
        message: "An internal server occured",
      },
    });
  }
});

app.patch("/api/reset", async (req, res) => {
  const { error } = emailSchema.validate(req.body);
  if (error)
    return res.status(400).json({
      error: {
        code: 400,
        message: error.details[0].message,
      },
    });

  let today = Date.now;

  try {
    let account = await User.findOne({ email: req.body.email });
    if (!account)
      return res.status(400).json({
        error: {
          code: 400,
          message: "Account not found",
        },
      });

    let object = account.usage.find((obj) => obj.date == today);
    // return res
    //   .status(201)
    //   .send({ message: "Success", data: object ? object : null });
    if (object) {
      if (object.count <= Number(process.env.MAX)) {
        //stop if the usage exceeds max API calls
        return res.status(429).send({
          error: {
            code: 429,
            message: "Max calls not exceeded",
          },
        });
      } else {
        //suppose to check for payment gateways and plans here
        account.usage = account.usage.shift();
        account.usage = [{ date: today, count: 1 }, ...account.usage];
        account.api_key = genAPIKey();
        await account.save();
        //i'm supoosed to send this as an email
        return res.status(201).send({ message: "Success", data: account });
      }
    } else {
      return res.status(400).json({
        error: {
          code: 400,
          message: "Go and signup bro!!!",
        },
      });
      // account.usage = [{ date: today, count: 1 }, ...account.usage];
      // account.api_key = genAPIKey();
      // await account.save();
      // return res.status(201).send({ message: "Success", data: account });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: {
        code: 500,
        message: "An internal server occured",
      },
    });
  }
});

app.listen(port, function (err) {
  if (err) {
    console.error("Failure to launch server");
    return;
  }
  console.log(`Listening on port ${port}`);
});
