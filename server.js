//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var path = require('path');

var fs = require('fs');
var url = require('url');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var mongoose = require('mongoose');                     // mongoose for mongodb

var http = require('http');
var bodyParser = require('body-parser');



//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://"+process.env.IP+":27017");     // connect to mongoDB database on modulus.io


var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

/*ToDO Requests */
router.get('/todo.json', function(req, res) {

  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var id = query.id;


  fs.readFile('todo.json', function(err, data) {

    if(id != undefined){
      var comments = JSON.parse(data);
          comments[id].checked = query.checked;
        fs.writeFile('todo.json', JSON.stringify(comments, null, 4), function(err) {
          res.setHeader('Cache-Control', 'no-cache');
          res.json(comments);
        });
    }else{
      res.setHeader('Cache-Control', 'no-cache');
      res.json(JSON.parse(data));
    }

  });

});


router.post('/todo.json', function(req, res) {
  fs.readFile('todo.json', function(err, data) {
    var comments = JSON.parse(data);
    comments.push(req.body);
    fs.writeFile('todo.json', JSON.stringify(comments, null, 4), function(err) {
      res.setHeader('Cache-Control', 'no-cache');
      res.json(comments);
    });
  });
});


 // define model =================
    var Todo = mongoose.model('Todo', {
        text : String,
        checked:String  
    });



 // api ---------------------------------------------------------------------
    // get all todos
    router.get('/api/todos', function(req, res) {
      
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var id = query.id;

        if(id != undefined){

            Todo.update({ _id: id }, { $set: { checked: query.checked}}, function(err){
              if(err){res.send(err);}
              else{

                  Todo.find(function(err, todos) {
          
                      // if there is an error retrieving, send the error. nothing after res.send(err) will execute
                      if (err)
                          res.send(err)
          
                      res.json(todos); // return all todos in JSON format
                  });

              }
            });
        }else{

          // use mongoose to get all todos in the database
          Todo.find(function(err, todos) {
  
              // if there is an error retrieving, send the error. nothing after res.send(err) will execute
              if (err)
                  res.send(err)
  
              res.json(todos); // return all todos in JSON format
          });
          
        }
    });

    // create todo and send back all todos after creation
    router.post('/api/todos', function(req, res) {
        
        var data = req.body;
        
        Todo.create({
            text : data.text,
            checked : data.checked
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });

    });

    // delete a todo
    router.delete('/api/todos/:todo_id', function(req, res) {
        Todo.remove({
            _id : req.params.todo_id
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });
    });


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
