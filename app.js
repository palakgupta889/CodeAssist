var http=require('http');
var express=require('express');
var bodyParser=require('body-parser');
var mysql=require('mysql');
var socket=require('socket.io');
var fs=require('fs');
var con=mysql.createConnection({
	host:"localhost",
	user:"root",
	password:"shshwt.grg",
	database:"Test"
});
con.connect(function(err){
	if(err) throw err;
	console.log("Server Started!");
});
var app=express();
app.use(express.static('public'));
http.createServer();
var urlencodeParser=bodyParser.urlencoded({extended:false});
var server=app.listen(3000);
app.set('view engine','ejs');
app.get('/signup',function(req,res){
	res.render('signup',{Name:req.query.Name,Password:req.query.Password,RePassword:req.query.RePassword,Email:req.query.Email});
});
app.post('/signup',urlencodeParser,function(req,res){
	if(req.body.Password===req.body.RePassword)
	{
		var sql="INSERT INTO User(Name,Password,Email) VALUES (?,?,?)";
		con.query(sql,[req.body.Name,req.body.Password,req.body.Email],function(err,result){
			if(err) throw err;
			console.log("Inserted New Value into User");
		});
	}
	else
		console.log("reenter");
	// res.render('mainpage',{Name:req.query.Name,Age:req.query.Age});
	res.redirect('/?Name='+req.body.Name);
	res.end("Inserted");
});
app.get('/signin',function(req,res){
	res.render('signin',{Name:req.query.Username,Pass:req.query.Pass});
});
app.post('/signin',urlencodeParser,function(req,res){
	var sql="SELECT * FROM User where Name=?";
		con.query(sql,[req.body.Username],function(err,result){
		if(err) throw err;
		var name=req.body.Username;
		var string = JSON.stringify(result);
		var json=JSON.parse(string);
		if(req.body.Pass==json[0].Password)
		{
			res.redirect('/?Name='+req.body.Username);
		}
	});
});
var io=socket(server);
var NAME='';
app.get('/',function(req,res){
	// if(res.query.Name!='a')
		NAME=req.query.Name;
		if(req.query.Name){
			NAME=req.query.Name;
			console.log('Connection Made by '+NAME);
			res.render('mainpage',{Name:req.query.Name});
		}
		else
			res.render('first');
});
var users={};
var Online_Users='';
io.on('connection',function(socket){
	socket.name=NAME;
	console.log('Connection Made by '+NAME);
	var session='UPDATE User SET SessionID=? where Name=?';
	con.query(session,[socket.id,NAME]);
	users[socket.name]=socket;
	var sql='UPDATE User SET Online=1 where SessionID=?';
	var sql2='UPDATE User SET Online=0 where SessionID=?';
	var online_users="select Name from User where Online=1";
	con.query(sql,[socket.id],function(err){
		if(err) throw err;
	});
	//console.log(users);
	socket.on('Online',function(){
		//console.log(111);
		con.query(online_users,function(err,result){
		if(err) throw err;
		// console.log(result);
		// var name=req.body.Username;
		var string = JSON.stringify(result);
		Online_Users=JSON.parse(string);
		Online_Users.forEach(function(item){
			// console.log(item.Name);
		});
	});
		// console.log(data);
		socket.broadcast.emit('Online',Online_Users);
	});
	socket.on('chat',function(data){
		// console.log(typeof(data.to));
		users[data.to].emit('chat',data);
	});
	socket.on('typing',function(data){
		socket.broadcast.emit('typing',data);
	});
	socket.on('clear_text',function(){
		socket.broadcast.emit('clear_text');
	});
	socket.on('error',function(err){
		console.log('Error!',err);
	});
	socket.on('room',function(room){
		socket.join(room);
	});
	socket.on('disconnect',function(sock){
		con.query(sql2,[socket.id]);
		socket.broadcast.emit('Online',Online_Users);
		console.log(socket.id+' disconnected');
	});
	var room='room1';
    socket.on('client_character',function(msg){
    	// console.log('Data from client: '+msg.buffer);
   		socket.in(room).broadcast.emit('server_character',msg.buffer);
   });
	socket.on('saveFile',function(data){
		fs.writeFileSync(__dirname+'\\codes\\'+data.fileName+'.txt',data.code);
   });
   socket.on('codeTogether',function(data){
		users[data.otherUser].emit('codeTogether',data);
   });
});