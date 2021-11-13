/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

//From location in FA
function htmlToElement(html){
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.FB_COLLECTION_PROJECTS = "Projects";
rhit.FB_KEY_NAME = "projectName";
rhit.FB_KEY_MATERIAL_NAME= "materialName";
rhit.FB_KEY_MATERIAL_URL = "materialURL";
rhit.FB_KEY_TASKS = "tasks";
rhit.FB_KEY_STATUS = "status";
rhit.FB_KEY_USER = "user";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_NUMBER_TASKS = "numberTasks";
rhit.FB_KEY_NUMBER_MATERIALS = "numberMaterials";

rhit.Project = class{
	constructor(id, name, user){
		this.id = id;
		this.name = name;
		this.user = user;
		
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
		window.location.href = `/projectList.html?`;
	}
	if(!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href = "/";
	}
};
rhit.initializePage = function(){
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#projectsList")) {
		console.log("You are on the project list page.");
		
		const uid = urlParams.get("uid");
		console.log("url param:  ", uid);
		rhit.fbProjectManager = new rhit.FbProjectManager(uid);
		new rhit.ProjectsPageController();
	}
	if (document.querySelector("#projectDetails")) {
		console.log("You are on the detail page.");


		const projectId = urlParams.get("id");
		
		if (!projectId) {
			console.log("Error: Missing project id.");
			window.location.href = "/";
		}
		rhit.fbSingleProjectManager = new rhit.FbSingleProjectManager(projectId);
		new rhit.DetailPageController();
	}
	
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		new rhit.LoginPageController();
	}
};
rhit.FbSingleProjectManager = class {
	constructor(projectId) {
	  this._documentSnapshot = {};
	  this._unsubscribe = null;
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PROJECTS).doc(projectId);
      console.log(`Listening to ${this._ref.path}`);
	}
	beginListening(changeListener) {
		console.log("REF: ",this._ref);
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if(doc.exists){
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			}else{
				console.log("No such document.");
			}
		});

	}
	addTask(task) {  
		
		this._ref.update({
			[rhit.FB_KEY_TASKS]: firebase.firestore.FieldValue.arrayUnion(task),
			[rhit.FB_KEY_NUMBER_TASKS]: this.numberTasks + 1

		
		});
		/* .then(function(docRef){
			console.log("document written with ID:", docRef.id);
		})
		.catch(function(error){
			console.log("Error adding document: ", error);
		}) */
	  }
	  addMaterial(name,url) {  
		
		this._ref.update({
			[rhit.FB_KEY_MATERIAL_NAME]: firebase.firestore.FieldValue.arrayUnion(name),
			[rhit.FB_KEY_MATERIAL_URL]: firebase.firestore.FieldValue.arrayUnion(url),
			[rhit.FB_KEY_NUMBER_MATERIALS]: this.numberMaterials + 1

		
		});
		/* .then(function(docRef){
			console.log("document written with ID:", docRef.id);
		})
		.catch(function(error){
			console.log("Error adding document: ", error);
		}) */
	  }
	  updateStatus(status) {  
		
		this._ref.update({
			[rhit.FB_KEY_STATUS]: status,

		
		});
		/* .then(function(docRef){
			console.log("document written with ID:", docRef.id);
		})
		.catch(function(error){
			console.log("Error adding document: ", error);
		}) */
	  }

	stopListening() {
		this._unsubscribe();
	  }
	//   update(quote, movie) {
	// 	  console.log(`update quote ${quote}`);
	// 	  console.log(`update movie ${movie}`);
	// 	  this._ref.update({
	// 		  [rhit.FB_KEY_QUOTE]: quote,
	// 		  [rhit.FB_KEY_MOVIE]: movie,
	// 		  [rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
  
	// 	  })
	// 	  .then(function(){
	// 		  console.log("Document successfully updated.");
	// 	  })
	// 	  .catch(function(error){
	// 		  console.log("Error adding document: ", error);
	// 	  })
	//   }
	  delete() {
		  return this._ref.delete();
	  }
  
	//   get quote(){
	// 	  return this._documentSnapshot.get(rhit.FB_KEY_QUOTE);
	//   }
	  get name(){
		  return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	  }
	  get author(){
		  return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	  }
	  get status(){
		  return this._documentSnapshot.get(rhit.FB_KEY_STATUS);
	  }
	  get numberTasks(){
		  return this._documentSnapshot.get(rhit.FB_KEY_NUMBER_TASKS);
	  }
	  get numberMaterials(){
		  return this._documentSnapshot.get(rhit.FB_KEY_NUMBER_MATERIALS);
	  }
	  get tasks(){
		  return this._documentSnapshot.get(rhit.FB_KEY_TASKS);
	  }
	  get materialsName(){
		  return this._documentSnapshot.get(rhit.FB_KEY_MATERIAL_NAME);
	  }
	  get materialsURL(){
		return this._documentSnapshot.get(rhit.FB_KEY_MATERIAL_URL);
	}
  
	 }

rhit.DetailPageController = class{
	constructor(){
		document.querySelector('#signOutButton').addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		document.querySelector('#submitAddTask').addEventListener("click", (event) => {
			const name = document.querySelector("#inputTask").value;
			rhit.fbSingleProjectManager.addTask(name);
			document.querySelector("#inputTask").value = "";
			$("#addTaskModal").modal("hide");
			
		});
		document.querySelector('#submitAddMaterial').addEventListener("click", (event) => {
			const name = document.querySelector("#inputMaterialName").value;
			const url = document.querySelector("#inputMaterialURL").value;
			rhit.fbSingleProjectManager.addMaterial(name,url);
			document.querySelector("#inputMaterialName").value = "";
			document.querySelector("#inputMaterialURL").value = "";
			$("#addMaterialModal").modal("hide");
			
		});
		document.querySelector('#submitUpdateStatus').addEventListener("click", (event) => {
			const status = document.querySelector("#updateStatus").value;
			rhit.fbSingleProjectManager.updateStatus(status);
			document.querySelector("#updateStatus").value = "";
			$("#updateStatusModal").modal("hide");
			
		});
		// document.querySelector('#submitEditQuote').addEventListener("click", (event) => {
		// 	const quote = document.querySelector("#inputQuote").value;
		// 	const movie = document.querySelector("#inputMovie").value;
		// 	rhit.fbSingleQuoteManager.update(quote,movie);
		// 	$("#editQuoteDialog").modal("hide");
		// });
		// document.querySelector('#submitDeleteQuote').addEventListener("click", (event) => {
		// 	rhit.fbSingleQuoteManager.delete().then(function(){
		// 		console.log("document successfully deleted.");
		// 		window.location.href = "/list.html";
		// 	}).catch(function(error){
		// 		console.log("Error removing document: ", error);
		// 	});
		// 	$("#deleteQuoteDialog").modal("hide");
			
		// });

		// $("#editQuoteDialog").on("show.bs.modal",(event) => {
		// 	//pre-animation
		// 	document.querySelector("#inputQuote").value = rhit.fbSingleQuoteManager.quote;
		// 	document.querySelector("#inputMovie").value = rhit.fbSingleQuoteManager.movie;
		// });
		// $("#editQuoteDialog").on("shown.bs.modal",(event) =>{
		// 	//post-animation
		// 	console.log("It's there");
		// 	document.querySelector("#inputQuote").focus();
		// });
		rhit.fbSingleProjectManager.beginListening(this.updateView.bind(this));
	}
	_createTaskCard(task){
		/* return htmlToElement(`<div class="myprojlist card">
		
		<!--  <input type="checkbox" class="centerlist bigCheck ">-->
		<h5 class=" card-body">&nbsp&nbsp&nbsp${task}</h5>
		</div>
		<hr>`); */
		return htmlToElement(`<li class="list-group-item">${task}</li>`)
	}
	_createTaskCardFeat(task){
		/* return htmlToElement(`<div class="myprojlist card">
		
		<!--  <input type="checkbox" class="centerlist bigCheck ">-->
		<h5 class=" card-body">&nbsp&nbsp&nbsp${task}</h5>
		</div>
		<hr>`); */
		return htmlToElement(`<li class="list-group-item card-header">${task}</li>`)
	}
	_createMaterialCard(name){
		/* return htmlToElement(`<div class="myprojlist card">
		
		<!--  <input type="checkbox" class="centerlist bigCheck ">-->
		<h5 class=" card-body">&nbsp&nbsp&nbsp${task}</h5>
		</div>
		<hr>`); */
		return htmlToElement(`<li class="list-group-item">${name}</li>`)
	}
	_createMaterialCardFeat(name){
		/* return htmlToElement(`<div class="myprojlist card">
		
		<!--  <input type="checkbox" class="centerlist bigCheck ">-->
		<h5 class=" card-body">&nbsp&nbsp&nbsp${task}</h5>
		</div>
		<hr>`); */
		return htmlToElement(`<li class="list-group-item card-header">${name}</li>`)
	}
	updateView(){
		document.querySelector("#projectTitle").innerHTML = rhit.fbSingleProjectManager.name;
		document.querySelector("#projectStatus").innerHTML = rhit.fbSingleProjectManager.status;
		const materialNameArray = rhit.fbSingleProjectManager.materialsName;
		const materialURLArray = rhit.fbSingleProjectManager.materialsURL;
		const taskArray = rhit.fbSingleProjectManager.tasks;
		
		
		const newList = htmlToElement(`<div id="taskList" class="card" style="">
		<ul class="list-group list-group-flush"></ul></div>`)
		//fill the list container with quote cards using a loop
		
		for (let i = 0; i < rhit.fbSingleProjectManager.numberTasks; i++){
			console.log("make card");
			const newtask = taskArray[i];
			console.log(newtask);
			let newCard = htmlToElement(`<p></p>`);
			if (i % 2 == 0){
				newCard = this._createTaskCard(newtask);
			}else{
				newCard = this._createTaskCardFeat(newtask);
			}
			
			newList.appendChild(newCard);
		}
		////remove the old list container
		const oldList = document.querySelector("#taskList");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		//put in the new list container
		oldList.parentElement.appendChild(newList);


		const newnewList = htmlToElement(`<div id="materialList" class="card" style="">
		<ul class="list-group list-group-flush"></ul></div>`)
		//fill the list container with quote cards using a loop
		
		for (let i = 0; i < rhit.fbSingleProjectManager.numberMaterials; i++){
			console.log("make card");
			const newName = materialNameArray[i];
			console.log(newName);
			let newCard = htmlToElement(`<p></p>`);
			if (i % 2 == 0){
				newCard = this._createMaterialCard(newName);
			}else{
				newCard = this._createMaterialCardFeat(newName);
			}
			
//			newCard.onclick = (event) => {
//				/* console.log(`you clicked on ${mq.id}`); */	
//				/* rhit.storage.setMovieQuoteId(mq.id); */

			//	window.location.href = `/project.html?id=${proj.id}`;
			//};
			newnewList.appendChild(newCard);
		}
		////remove the old list container
		const oldoldList = document.querySelector("#materialList");
		oldoldList.removeAttribute("id");
		oldoldList.hidden = true;
		//put in the new list container
		oldoldList.parentElement.appendChild(newnewList);

	}
}
rhit.FbProjectManager = class {
	constructor(uid) {
		console.log("Project Manager Created");
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
			[rhit.FB_KEY_STATUS] : "Add Status",
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_MATERIAL_NAME]: ["test 1","test 2"],
			[rhit.FB_KEY_MATERIAL_URL]: [],
			[rhit.FB_KEY_NUMBER_MATERIALS]: 2,
			[rhit.FB_KEY_TASKS]:["tasky boy 1"],
			[rhit.FB_KEY_NUMBER_TASKS]: 0,

		
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
		//if(this._uid){
			console.log(`${rhit.FB_KEY_USER}  :  ${rhit.fbAuthManager.uid}`);
			console.log("HERERERERERE");
			query = query.where(rhit.FB_KEY_USER, "==", rhit.fbAuthManager.uid);
		//}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Project update:");
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
	getProjectAtIndex(index) {  
		const docSnapshot = this._documentSnapshots[index];
		
		const proj = new rhit.Project(
			docSnapshot.id, 
			docSnapshot.get(rhit.FB_KEY_NAME),
			docSnapshot.get(rhit.FB_KEY_USER)
		);
		
		return proj;
	  }
   }

rhit.ProjectsPageController = class {
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
	document.querySelector('#submitAddProject').addEventListener("click", (event) => {
		const name = document.querySelector("#inputName").value;
		rhit.fbProjectManager.addProject(name);
		// const ref = firebase.storage().ref();
		// const file = document.querySelector("#selectPhoto").files[0];
		// const filename = fbAuthManager.uid + name + file.name;
		// const metadata = {contentType: file.type};
		// ref.child(filename).put(file,metadata);
		// upload.then(snapshot=>snapshot.ref.getDownloadURL());
		$("#addProjectModal").modal("hide");
		
		
		// const photo = document.querySelector("#selectPhoto").files;
		// if(photo.length === 0){
		// 	console.error("No file selected.");
		// 	return
		// }else{
		// 	for(const file of photo){
		// 		const image = document.createElement("img");
		// 		image.src = URL.createObjectURL(file);
		// 		console.log("Image source:");
		// 		console.log(image.src);

		// 	}
		// }
	});
	// document.querySelector('#menuShowMyQuotes').addEventListener("click", (event) => {
	// 	console.log("Show my quotes");
	// 	window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
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

	rhit.fbProjectManager.beginListening(this.updateList.bind(this));

}

_createCard(proj){
	return htmlToElement(`<div class="card">
	<div class="card-body">
		<h5 class="card-title">Project: ${proj.name}</h5>
		<h6 class="card-subtitle mb-2 text-muted">By: ${proj.user}</h6>
	</div>
	</div>`);
}

updateList() {
	console.log("I need to update thie list on the page!");
	console.log(`Num projects = ${rhit.fbProjectManager.length}`);
	console.log(`User: ${rhit.fbAuthManager.uid}`);
	//console.log("Example project = ", rhit.fbProjectManager.getProjectAtIndex(0));
	//make new list container
	const newList = htmlToElement('<div id="projectListContainer"></div>');
	//fill the list container with quote cards using a loop
	for (let i = 0; i < rhit.fbProjectManager.length; i++){
		const proj = rhit.fbProjectManager.getProjectAtIndex(i);
		const newCard = this._createCard(proj);
		newCard.onclick = (event) => {
			/* console.log(`you clicked on ${mq.id}`); */	
			/* rhit.storage.setMovieQuoteId(mq.id); */

			window.location.href = `/project.html?id=${proj.id}`;
		};
		newList.appendChild(newCard);
	}
	////remove the old list container
	const oldList = document.querySelector("#projectListContainer");
	oldList.removeAttribute("id");
	oldList.hidden = true;
	//put in the new list container
	oldList.parentElement.appendChild(newList);
}
}
rhit.startFirebaseUI = function(){
	// FirebaseUI config.
	var uiConfig = {
		signInSuccessUrl: '/',
		signInOptions: [
			// Leave the lines as is for the providers you want to offer your users.
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
		};

		// Initialize the FirebaseUI Widget using Firebase.
		const ui = new firebaseui.auth.AuthUI(firebase.auth());
		// The start method will wait until the DOM is loaded.
		ui.start('#firebaseui-auth-container', uiConfig);
};
/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.startFirebaseUI();
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("Auth Change Callback Fired");
		console.log("isSignedIn = ",rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	})
	
	
	
};

rhit.main();
