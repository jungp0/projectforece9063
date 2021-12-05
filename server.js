const express = require("express");
const app = express();

const path = require("path");
const fs = require('fs');

let jdata = JSON.parse(fs.readFileSync('web.json'));

app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

app.get('/', (req,res) =>{
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.post('/info', (req,res)=>{
    // console.log(2);
    // console.log(req.body);
    jdata = req.body;
    fs.writeFileSync('web.json',JSON.stringify(jdata),(err) =>{
        if (err){
            throw err;
        }
    });
    res.send(200);
});

app.put('/add', (req,res)=>{
    // console.log(3);

    let bdata = req.body;
    jdata = Object.assign(jdata, bdata);
    fs.writeFileSync('web.json',JSON.stringify(jdata),(err) =>{
        if (err){
            throw err;
        }
    });
    res.send(200);
});

app.get('/info', (req, res)=> {
    jdata = JSON.parse(fs.readFileSync('web.json'));
    res.json(jdata);
    // console.log(jdata);
});

// start the server listening for requests
let listener = app.listen(process.env.PORT || 3000, 
	() => console.log(`Server is running...${listener.address().port}`));