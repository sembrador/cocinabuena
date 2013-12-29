Meteor.startup(function () {
  if(blogPosts.find({}).count() == 0){
    tags.insert({tag: "automatico"}, function(err, tag){
      if(err){
        console.log(err);
      }else{
        comments.insert({
          comment: "hola mundo!",
          author: "robot comentador",
          pubdate: new Date()
        }, function(err, _id){
          if(err){
            console.log(err);
          }else{
            blogPosts.insert({
              title: "Bienvenido a Cocina Buena",
              body: "Este es un mensaje de ejemplo grabado por el servidor de Cocina Buena. Elimine este mensaje y comienze a comentar!",
              author: "El Robot de Cocina Buena",
              pubdate: new Date(),
              tags: ["automatico"],
              removeable: true,
              comments: [_id]
            });

          }
        });
      }
    });
  }
});

var blogPosts = new Meteor.SmartCollection("blogPosts");
var tags = new Meteor.SmartCollection("tags");
var comments = new Meteor.SmartCollection("comments");

var locked = false;

if(locked == true){
  Accounts.config({forbidClientAccountCreation : true});
}

Meteor.publish("blogPosts", function(){
  return blogPosts.find({});
});

Meteor.publish("tags", function(){
  return tags.find({});
});

Meteor.publish("comments", function(){
  return comments.find({});
});

Meteor.publish("userData", function () {
  return Meteor.users.find({_id: this.userId},
                           {fields: {'admin': 1}});
});

tags.allow({
  insert: function(userId, doc){
    return userId && doc.tag != "";
  }
});

comments.allow({
  insert: function(userId, doc){
    return userId;
  },
  remove: function(userId, doc){
    return doc.author == Meteor.user().username || Meteor.user().admin == true;
  },
  update: function(userId, doc, fields){
    return doc.author == Meteor.user().username &&  ! _.contains(fields, ['author', 'pubdate']) || Meteor.user().admin == true;
  }
})

blogPosts.allow({
  insert: function(userId, doc){
    return userId;
  },
  update: function (userId, doc, fields, modifier) {
    // can only change your own documents
    return doc.author === Meteor.user().username && ! _.contains(fields, ['comments']) || ! _.contains(fields, ['title', 'body', 'author', '_id', 'pubdate', 'removeable', 'tags']) || Meteor.user().admin == true;
  },
  remove: function (userId, doc) {
    // can only remove your own documents
    return doc.author === Meteor.user().username || doc.removeable === true || Meteor.user().admin == true;
  }
});