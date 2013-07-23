function include(arr, obj) {
    for(var i=0; i<arr.length; i++) {
        if (arr[i] == obj) return true;
    }
}

Deps.autorun(function () {
document.title = Session.get("pageTitle") + " | Inkly";
});

Session.set("searchQuery", "");
Session.set("selectedTags", []);

Meteor.subscribe("blogPosts");
blogPosts = new Meteor.Collection("blogPosts");

Meteor.subscribe("tags");
tags = new Meteor.Collection("tags");

Accounts.ui.config({passwordSignupFields: 'USERNAME_ONLY'});

Template.navbar.events({
	'click #newPost': function(e){
		Meteor.Router.to('/');
		Session.set("clickedEdit", true);
	},
	'keyup #search': function(e){
		Session.set("searchQuery", $(e.target).val());
	}
});

Template.editPost.events({
	'click .closeEdit': function(e){
		Session.set("clickedEdit", false);
		Session.set("editing", false);
		Session.set("editing_post", undefined);
		Session.set("addingTag", false);
	},
	'click .addTag': function(e){
		Session.set("addingTag", true);
	},
	'click .createTag': function(e){
		e.preventDefault();
		tags.insert({tag: $('#newTag').val()});
		Session.set("addingTag", false);
	},
	'click #submitPost': function(e){
		e.preventDefault();
		var post = {};
		post.title = $('input#title').val();
		post.body = $('#wysihtml5-textarea').val();
		post.author = Meteor.user().username;
		post.tags = [];
		post.pubdate = new Date();
		$('select#tags option:selected').each(function(i){
			post.tags[i] = $(this).val();
		})
		if(Session.get("editing_post")){
			var _id = Session.get("editing_post")._id;
			blogPosts.update({_id: _id}, {$set: post});
		}else{
			post.comments = [];
			blogPosts.insert(post);

		}
			Session.set("clickedEdit", false);
			Session.set("editing", false);
			Session.set("editing_post", undefined);
			Session.set("addingTag", false);
	}
});

Template.blogPosts.events({
	'click .editPost': function(e){
		var _id = $(e.target).closest("div").attr("id");
		var post = blogPosts.findOne({_id: _id});
		Session.set("editing_post", post);
		Session.set("editing", true);
		Session.set("clickedEdit", true);
	},
	'click .deletePost': function(e){
		var _id = $(e.target).closest("div").attr("id");
		blogPosts.remove({_id: _id});
	},
	'click a.tagged': function(e){
		var tags = Session.get("selectedTags");
		if(include(tags, $(e.target).text()) != true){
		tags.push($(e.target).text());
		}
		Session.set("selectedTags", tags);
	}
});

Template.footer.events({
	'click .deSelect': function(e){
		var tags = Session.get("selectedTags");
		var index = tags.indexOf($(e.target).closest("span").attr("id"));
		tags.splice(index, 1);
		Session.set("selectedTags", tags);
	}
});

Template.onePost.events({
	'click a.comment': function(e){
		Session.set("postingComment", true);
	},
	'click a.exitComment': function(e){
		Session.set("postingComment", false);
	},
	'click button#submitComment': function(e){
		var commentObj = {};
		commentObj.comment = $('textarea#comment').val();
		commentObj.pubdate = new Date();
		commentObj.author = Meteor.user().username;
		blogPosts.update({_id: Session.get("currentPost")}, {$push: {comments: commentObj}});
		Session.set("postingComment", false);
	}
});

Template.navbar.loggedIn = function(){
	if(Meteor.user()){
		return true;
	}else{
		return false;
	}
}

Template.footer.selectedTags = function(){
	return Session.get("selectedTags");
}

Template.blogPosts.userMatch = function(user){
	if(Meteor.user()){
	if(user == Meteor.user().username){
		return true;
	}else{
		return false;
	}
}
}

var commentCount = function(comments){
	if(comments.length == 1){
		return "1 Comment";
	}else{
		return comments.length + " Comments";
	}
}

Template.blogPosts.numComments = function(comments){
	return commentCount(comments);
}

Template.onePost.numComments = function(comments){
	return commentCount(comments);
}

Template.onePost.userMatch = function(user){
	if(Meteor.user()){
	if(user == Meteor.user().username){
		return true;
	}else{
		return false;
	}
}
}

Template.onePost.loggedIn = function(){
	return Meteor.user()
}

Template.blogPosts.posts = function(){
	searchExp = new RegExp(".*" + Session.get("searchQuery") + ".*", "i");
	if(Session.get("selectedTags") == ""){
		query = {$exists: true};
	}else{
		query = {$in: Session.get("selectedTags")};
	}
	return blogPosts.find({tags: query, $or:[{title: searchExp}, {body: searchExp}]}, {sort: {pubdate: -1}});
}

Template.editPost.clickedEdit = function(){
	return Session.get("clickedEdit");
}

Template.editPost.addingTag = function(){
	return Session.get("addingTag");
}

Template.editPost.post = function(){
	if(Session.equals("editing", true)){
		return Session.get("editing_post");
	}else{
		return null;
	}
}

Template.editPost.tags = function(){
	var editTags = tags.find({});

		editTags = editTags.fetch();
		for(i=0;i<editTags.length; i++){
			if(Session.get("editing_post")){
			if(include(Session.get("editing_post").tags, editTags[i].tag)){
				editTags[i].selected = true;
			}
			}
		}
		return editTags;
}

Meteor.Router.add({
   '/':function(){
   		Session.set("home", true);
   		Session.set("clickedEdit", false);
   		Session.set("currentPost", undefined);
   		Session.set("viewingAbout", false);
   		Session.set("pageTitle", "Home");
   		return 'home';
   },

   '/posts/:id': function(id) {
   	Session.set("currentPost", id);
   	Session.set("viewingAbout", false);
   	Session.set("home", false);
    return 'onePost';
  },
  '/about': function(){
  	Session.set("viewingAbout", true);
  	Session.set("home", false);
  	Session.set("currentPost", undefined);
  	Session.set("pageTitle", "About");
  	return 'about';

  }
});

Template.onePost.post = function(){
	post =  blogPosts.findOne({_id: Session.get("currentPost")});
	Session.set("pageTitle", post.title);
	return post;
}

Template.navbar.currentPost = function(){
	return blogPosts.findOne({_id: Session.get("currentPost")});
}
Template.navbar.viewingAbout = function(){
	return Session.get("viewingAbout");
}
Template.navbar.home = function(){
	return Session.get("home");
}

Template.onePost.postingComment = function(){
	return Session.get("postingComment");
}