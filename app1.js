// Require necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
// Initialize Express app
const app = express();
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your_secret_key', // Change this to a secure secret key
    resave: false,
    saveUninitialized: true
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// MySQL database connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'exam_system'
});

// Connect to the MySQL database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        throw err;
    }
    console.log('MySQL connected...');
});

// Routes
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
//  });
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});
app.get('/faculty_login', (req, res) => {
  res.render('faculty_login');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.get('/create_exam', (req, res) => {
    res.render('create_exam');
});

// Assume you have a route for displaying the exam questions to the user
app.get('/take_exam', (req, res) => {
  // Retrieve exam name from the query parameters
  const examName = req.query.examName; // Assuming the exam name is passed as a query parameter

  // Validate examName to prevent SQL injection (you should use parameterized queries for production)
  if (!examName) {
      res.status(400).send('Exam name is required');
      return;
  }

  // Retrieve exam questions for the specified exam name from the database
  const sql = 'SELECT * FROM questions WHERE exam_name = ?';
  db.query(sql, [examName], (err, results) => {
      if (err) {
          console.error('Error retrieving exam questions:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // Check if any questions were found for the specified exam name
      if (results.length === 0) {
          res.status(404).send('No questions found for the specified exam');
          return;
      }

      // Render the take_exam page and pass the questions to the view
      res.render('take_exam', { questions: results });
  });
});

// Assuming you have a route handler for /take_exam
app.get('/take_exam', (req, res) => {
  // Assuming you retrieve the username from the session or database
  const username = req.session.username; // Adjust this based on your actual implementation

  // Render the take_exam.ejs template and pass the username variable
  res.render('take_exam', { username: username });
});


// Route to handle submission of the exam
// Route to handle submission of the exam
// Route to handle submission of the exam
// Route to handle submission of the exam and store marks in the results table
app.post('/submit_exam', (req, res) => {
  const answers = req.body; // Assuming answers are submitted as an object with question IDs as keys and chosen options as values
  const updatedAnswers = {};

  // Create keys in the updatedAnswers dictionary with the format "answer_id"
  let count = 1;
  for (let key in answers) {
      if (answers.hasOwnProperty(key)) {
          updatedAnswers[`answer_id_${count}`] = answers[key];
          count++;
      }
  }

  console.log(updatedAnswers);

  // Retrieve correct answers from the database
  const sqlSelectQuestions = 'SELECT id, correct_answer FROM questions';
  db.query(sqlSelectQuestions, (err, questionResults) => {
      if (err) {
          console.error('Error retrieving correct answers:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      console.log('DB Results:', questionResults); // Debugging: Log database results

      // Calculate marks based on submitted answers and correct answers
      let marks = 0;
      let iter = 0;

      for (let key in updatedAnswers) {
          if (updatedAnswers.hasOwnProperty(key)) {
              //console.log(`Key: ${key}, Value: ${updatedAnswers[key]}`);
              const row = questionResults[iter];
              if (updatedAnswers[key] == row.correct_answer) {
                  marks = marks + 1;
              }
              iter++;
          }
      }
      console.log('Marks:', marks);

              console.log('Result inserted successfully');
              res.status(200).send(`Your marks: ${marks}`);
          });
      });





app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

app.post('/register_form', (req, res) => {
    const { username, password, name, rollnumber } = req.body;
    
    // Inserting user data into the database
    const sql = 'INSERT INTO users (username, password, name, rollnumber) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, password, name, rollnumber], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error registering user');
            return;
        }
        console.log('User registered successfully');
        res.redirect('/'); // Redirect to homepage or any other page after successful registration
    });
});

app.post('/login_form', (req, res) => {
    const { username, password } = req.body;
    req.session.username = username;
    if(username == 'admin' && password == 'admin') {
        res.render('create_exam', { username: username });
        return;
    }

    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length === 0) {
            // No matching user found, return an error response
            res.status(401).send('Invalid username or password');
        } else {
            // Username and password match, user is authenticated
            //res.send('Login successful');
            res.render('dashboard', { username: username }); // You can redirect or send any response you like here
        }
    });
});
app.post('/faculty_login_form', (req, res) => {
  const { username, password } = req.body;
  req.session.username = username;
  if(username == 'admin' && password == 'admin') {
      res.render('create_exam', { username: username });
      return;
  }

  const sql = 'SELECT * FROM faculty WHERE name = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
          return;
      }

      if (results.length === 0) {
          // No matching user found, return an error response
          res.status(401).send('Invalid username or password');
      } else {
          // Username and password match, user is authenticated
          //res.send('Login successful');
          res.render('create_exam', { username: username }); // You can redirect or send any response you like here
      }
  });
});

app.post('/save_exam', (req, res) => {
    const { examName, numQuestions } = req.body;
    req.session.examName = examName;
    // Extract question data from request body
        // Extract question data from request body
        const questions = [];
        for (let i = 1; i <= numQuestions; i++) {
          const question = {
            id: req.body[`id${i}`],
            question: req.body[`question${i}`],
            option1: req.body[`option1${i}`],
            option2: req.body[`option2${i}`],
            option3: req.body[`option3${i}`],
            option4: req.body[`option4${i}`],
            correctAnswer: req.body[`correctAnswer${i}`],
            examName:examName,
          };
          questions.push(question);
        }
      
        // Insert exam data into the database
        db.beginTransaction((err) => {
          if (err) {
            console.error('Error beginning transaction:', err);
            return res.status(500).send('Internal server error');
          }
          // const gate_id = "gate";
      
          // Insert exam details into the 'exams' table
          // db.query('INSERT INTO questions (exam_name) VALUES (?)', [examName], (err, result) => {
          //   if (err) {
          //     console.error('Error inserting exam details:', err);
          //     return db.rollback(() => {
          //       res.status(500).send('Internal server error');
          //     });
          //   }
      
            // const examId = result.insertId; // Get the auto-generated exam ID
      
            // Insert questions into the 'questions' table
            const insertQueries = questions.map((question, index) => {
              return new Promise((resolve, reject) => {
                db.query('INSERT INTO questions (id,question, option1, option2, option3, option4, correct_answer,exam_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                  [question.id,question.question, question.option1, question.option2, question.option3, question.option4, question.correctAnswer,question.examName], 
                  (err, result) => {
                    if (err) {
                      console.error('Error inserting question:', err);
                      return reject(err);
                    }
                    resolve();
                  }
                );
              });
            });
      
            // Execute all insert queries
            Promise.all(insertQueries)
              .then(() => {
                // Commit transaction
                db.commit((err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    return db.rollback(() => {
                      res.status(500).send('Internal server error');
                    });
                  }
      
                  res.status(200).send('Exam saved successfully!');
                });
              })
              .catch((err) => {
                console.error('Error executing insert queries:', err);
                db.rollback(() => {
                  res.status(500).send('Internal server error');
                });
              });
          });
        });
    
    // Start server
    const PORT = process.env.PORT || 3307;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    
