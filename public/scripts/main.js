/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};


rhit.FB_COLLECTION_PROJECTS = "Projects";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_MATERIALS = "materials";
rhit.FB_KEY_TASKS = "tasks";
rhit.FB_KEY_STATUS = "status";
rhit.FB_KEY_USER = "user";

rhit.Project = class{
	constructor(id, name, user, status, materials, tasks){
		this.id = id;
		this.name = name;
		this.user = user;
		this.materials = materials;
		this.tasks = tasks;
		this.status = status;
	}
}

rhit.LoginPageController = class{
	constructor(){
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};
		
	}

}
rhit.FbAuthManager = class {
	constructor(){
		this._user = null;
		console.log("Made auth manager");
	}
	beginListening(changeListener){
		firebase.auth().onAuthStateChanged((user)=>{
			this._user = user;
			changeListener();
		});
	}

	signIn(){
		console.log("Sign In");
		Rosefire.signIn("dfbdae03-83d8-4b3e-9136-e164bc2981da", (err, rfUser) => {
			if (err) {
			console.log("Rosefire error!", err);
			return;
			}
			console.log("Rosefire success!", rfUser);
			
			firebase.auth().signInWithCustomToken(rfUser.token).catch(function(error) {
			    // Handle Errors here.
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
				  alert('The token you provided is not valid.');
				} else {
				  console.error("Custom auth error", errorCode,errorMessage);
				}
			});
		});
		

	}
	signOut(){
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn(){
		return !!this._user;
	}
	get uid(){
		return this._user.uid;
	}
	
}
rhit.checkForRedirects = function(){
	if(document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href = `/projectList.html?uid=${rhit.fbAuthManager.uid}`;
	}
	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href = "/";
	}
};
rhit.initializePage = function(){
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#projectsPage")) {
		console.log("You are on the project list page.");
		
		const uid = urlParams.get("uid");
		console.log("url param:  ", uid);
		rhit.fbProjectManager = new rhit.FbProjectManager(uid);
		new rhit.ListPageController();
	}
	// if (document.querySelector("#detailPage")) {
	// 	console.log("You are on the detail page.");

	// 	/* const movieQuoteId = rhit.storage.getMovieQuoteId(); */

	// 	const movieQuoteId = urlParams.get("id");
		
	// 	if (!movieQuoteId) {
	// 		console.log("Error: Missing movie quote id.");
	// 		window.location.href = "/";
	// 	}
	// 	rhit.fbSingleQuoteManager = new rhit.FbSingleQuoteManager(movieQuoteId);
	// 	new rhit.DetailPageController();
	// }
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		new rhit.LoginPageController();
	}
};
rhit.FbProjectManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PROJECTS);
		this._unsubscribe = null;
	}
	addProject(name) {  
		console.log(`add Project: ${name} by ${rhit.fbAuthManager.uid}`);
		this._ref.add({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_USER]: rhit.fbAuthManager.uid,
			

		})
		.then(function(docRef){
			console.log("document written with ID:", docRef.id);
		})
		.catch(function(error){
			console.log("Error adding document: ", error);
		})
	  }
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED,"desc").limit(50);
		if(this._uid){
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Movie quotes update:");
			this._documentSnapshots = querySnapshot.docs;
			/* querySnapshot.forEach((doc) => {
				console.log(doc.data);
			}); */
			changeListener();
			
		});
	}
	stopListening() {  
		this._unsubscribe();
	  }
	/* update(id, quote, movie) {    }
	delete(id) { } */
	get length() {  
		return this._documentSnapshots.length;
	  }
	getMovieQuoteAtIndex(index) {  
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.MovieQuote(
			docSnapshot.id, 
			docSnapshot.get(rhit.FB_KEY_QUOTE),
			docSnapshot.get(rhit.FB_KEY_MOVIE)
		);
		
		return mq;
	  }
   }

rhit.ListPageController = class {
constructor() {
	// document.querySelector('#signOutButton').addEventListener("click", (event) => {
	// 	const quote = document.querySelector("#inputQuote").value;
	// 	const movie = document.querySelector("#inputMovie").value;
	// 	rhit.fbMovieQuotesManager.add(quote,movie);
	// 	$("#exampleModal").modal("hide");
	// });
	document.querySelector('#signOutButton').addEventListener("click", (event) => {
		rhit.fbAuthManager.signOut();
	});
	// document.querySelector('#menuShowMyQuotes').addEventListener("click", (event) => {
	// 	console.log("Show my quotes");
	// 	window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
	// });
	// document.querySelector('#signOut').addEventListener("click", (event) => {
	// 	rhit.fbAuthManager.signOut();
	// });

	// $("#exampleModal").on("show.bs.modal",(event) => {
	// 	//pre-animation
	// 	document.querySelector("#inputQuote").value = "";
	// 	document.querySelector("#inputMovie").value = "";
	// });
	// $("#exampleModal").on("shown.bs.modal",(event) =>{
	// 	//post-animation
	// 	console.log("It's there");
	// 	document.querySelector("#inputQuote").focus();
	// });

	// rhit.fbMovieQuotesManager.beginListening(this.updateList.bind(this));

}

_createCard(movieQuote){
	return htmlToElement(`<div class="card">
	<div class="card-body">
		<h5 class="card-title">${movieQuote.quote}</h5>
		<h6 class="card-subtitle mb-2 text-muted">${movieQuote.movie}</h6>
	</div>
	</div>`);
}

updateList() {
	console.log("I need to update thie list on the page!");
	console.log(`Num quotes = ${rhit.fbMovieQuotesManager.length}`);
	console.log("Example quote = ", rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(0));
	//make new list container
	const newList = htmlToElement('<div id="quoteListContainer"></div>');
	//fill the list container with quote cards using a loop
	for (let i = 0; i < rhit.fbMovieQuotesManager.length; i++){
		const mq = rhit.fbMovieQuotesManager.getMovieQuoteAtIndex(i);
		const newCard = this._createCard(mq);
		newCard.onclick = (event) => {
			/* console.log(`you clicked on ${mq.id}`); */	
			/* rhit.storage.setMovieQuoteId(mq.id); */

			window.location.href = `/moviequote.html?id=${mq.id}`;
		};
		newList.appendChild(newCard);
	}
	//remove the old list container
	const oldList = document.querySelector("#quoteListContainer");
	oldList.removeAttribute("id");
	oldList.hidden = true;
	//put in the new list container
	oldList.parentElement.appendChild(newList);
}
}
/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("Auth Change Callback Fired");
		console.log("isSignedIn = ",rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	})
	
};

rhit.main();
