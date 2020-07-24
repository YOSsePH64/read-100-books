const http = require("http");
const fs = require("fs");
const https = require("https");
const cheerio = require("cheerio");
const getFileFromUrl = require("@appgeist/get-file-from-url");

const goodreadsUrl = "https://www.goodreads.com/list/show/7.Best_Books_of_the_21st_Century"; 

let Book = {
	/**
	* Inititalization 
	**/
	init : function(which) {
		this.number = which;
		this.doEverything();
		this.

	} ,

	/**
	* Execute All Necessary Functions
	**/ 

	doEverything : function() {
			let func  = this.goodreadsHTMLFileExists() ? this.readFromHTMLFile : this.readFromWeb
			func(goodreadsUrl)
					.then(data => {
							this.retreiveBookData(data);
							this.generateUrlForGenLib();
						})
					.then(() => {
							this.readFromWeb(this.libgenurl)
							.then((data)=> {
									this.downloadBook(data);
								})
							})
			
	} , 

	/** 
	* Check if a goodreads.html file exists in Working Directory
	* ( Check if this is ur first time )
	* @return {boolean} 
	**/

	goodreadsHTMLFileExists() {
		if(fs.existsSync("./goodreads.html")) {
			return true;
		}
		return false;
	} ,

	/**
	* Reads an html File
	* @return {Promise.<html>}
	**/ 

	readFromHTMLFile : function() {
		let buf =  fs.readFileSync("./goodreads.html")
		let html = buf.toString()
		return Promise.resolve(html);
	},

	/**
	* 
	* @return {Promise<data>}
	**/ 

	readFromWeb : function(url) {
			let protocol = (/http:\/\//.test(url)) ? eval("http") : eval("https");
			return new Promise((resolve , reject)  => {
				protocol.get( url , res => {
				let data = "";
				res.on("data" , d =>{ 
					console.log(d)
					data += d;

				});
				res.on("error" , err =>{ 
					console.log("Error " , err);
				})
				res.on("end" , () => {
					if(url == goodreadsUrl) {
						console.log("Writing to file ");
						fs.writeFile('goodreads.html' , data , err => (err) ? console.log(err) : '');
					}
					resolve(data);
				})
			})
		})
	} , 

	/**
	* Takes html file retrieved using readForWeb
	* Assigns the Book Info to the Object
	* @void 
	**/

	retreiveBookData : function(data) {
		let $ = cheerio.load(data);
		let table = $(".tableList");
		let links = table.find("a.bookTitle");
		let fullBooksInfo = Array.from(links).map(function(link){
			let span = $(link).siblings('span')[1];
			let author = $(span).find('a').find('span').text();
			let book = $(link).attr('href').match(/\d+[.-](.*)/)[1]
			return {
				author : author , 
				book : book , 
			}
		});
		Book.info = fullBooksInfo[this.number - 1];

	} ,

	/**
	* 
	**/ 

	generateUrlForGenLib : function(data) {
		Book.libgenurl = `http://gen.lib.rus.ec/fiction/?q=${Book.info.author}+${Book.info.book}&criteria=&language=English&format=epub`;
	} , 
	/**
	* Downloads the book from http://gen.lib.rus.ec
	* @param {fs.dir} a directory where the book will be savedd
	*				 default value current directory
	* 
	**/

	downloadBook : function(data , dir) {
		let $ = cheerio.load(data);
		let link = $(".record_mirrors_compact").find('li').first().find('a').first().attr('href');
		console.log(link);
		this.readFromWeb(link).then(d => {
			$ = cheerio.load(d)
			let td = $('td#info');
			let epubLink = $('td#info').find('a').first().attr('href')
			const localFileName = getFileFromUrl({
				url : epubLink , 
				file : dir + Book.info.book + Book.info.author + ".epub"
			})
		})
	}

} 

Book.init(28);

