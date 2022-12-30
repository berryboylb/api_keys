const users = require("./initialData").users;
const User = require("./models/User");

const genAPIKey = () => {
  //create a base-36 string that contains 30 chars in a-z,0-9
  return [...Array(30)]
    .map((e) => ((Math.random() * 36) | 0).toString(36))
    .join("");
};

const createUser = async (body, req) => {
  let today = new Date().toISOString().split("T")[0];
  //create new user instance
  let newUser = new User({
    name: body.name,
    email: body.email,
    api_key: genAPIKey(),
    usage: [{ date: today, count: 0 }],
  });
  await newUser.save();
  return newUser;
};

const authenticateKey = async (req, res, next) => {
  let api_key = req.header("x-api-key"); //Add API key to headers

  if (!api_key)
    return res.status(400).json({
      error: {
        code: 400,
        message: "No api key",
      },
    });
  let account = await User.findOne({ api_key });
  // find() returns an object or undefined
  if (account) {
    //If API key matches
    //check the number of times the API has been used in a particular day
    let today = new Date().toISOString().split("T")[0];
    let usageCount = account.usage.findIndex((day) => day.date == today);
    if (usageCount >= 0) {
      //If API is already used today
      if (account.usage[usageCount].count >= Number(process.env.MAX)) {
        //stop if the usage exceeds max API calls
        res.status(429).send({
          error: {
            code: 429,
            message: "Max API calls exceeded.",
          },
        });
      } else {
        //have not hit todays max usage
        account.usage[usageCount].count++;
        console.log("Good API call", account.usage[usageCount]);
        next();
      }
    } else {
      //Push todays's date and count: 1 if there is a past date
      // account.usage.push({ date: today, count: 1 });
      account.usage = [{ date: today, count: 1 }, ...account.usage];
      //ok to use again
      next();
    }
  } else {
    //Reject request if API key doesn't match
    res.status(403).send({ error: { code: 403, message: "You not allowed." } });
  }
};

const generateNewKey = async (req, res, next) => {
  const email = req.body.email;
  if (!email)
    return res.status(400).json({
      error: {
        code: 400,
        message: "Email is is required",
      },
    });

  let account = await User.findOne({ email });

  if (!account)
    return res.status(400).json({
      error: {
        code: 400,
        message: "Account not found",
      },
    });

    let today = new Date().toISOString().split("T")[0];
    let usageCount = account.usage.findIndex((day) => day.date == today);
    // if()
};
module.exports = { createUser, authenticateKey, generateNewKey, genAPIKey };
