var autosaveDuration = 2000;
var AssView;
var currentCourse;
var currentUser;

$(function(){
  /*
   * Models
   */
  var Student = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "new student...",
        order: AllAssignments.nextOrder()
      };
    },
    courses: function() {
      return _.filter(AllCourses, function(course){
        return _.contains(course.students, this);
      });
    }
  });
  var Parent = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "new parent...",
        order: AllAssignments.nextOrder(),
        children: new Array
      };
    },
  });
  var Teacher = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "new teacher...",
        order: AllAssignments.nextOrder(),
      };
    },
    courses: function() {
      return AllCourses.where({teacher: this});
    }
  });
  var Assignment = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "new assignment...",
        order: AllAssignments.nextOrder(),
        dueDate: new Date(),
        description: null,
        studentComplete: false,
        parentComplete: false,
        course: null
      };
    }
    //,
    //toggleStudentComplete: function() {
    //  this.save({studentComplete: !this.get("studentComplete")});
    //},
    //toggleParentComplete: function() {
    //  this.save({parentComplete: !this.get("parentComplete")});
    //}
  });
  var Course = Backbone.Model.extend({
    defaults: function() {
      return {
        name: "new course...",
        order: AllCourses.nextOrder(),
        students: new Array,
        teacher: new Teacher
      };
    },
    assignments: function() {
      return AllAssignments.where({course: this});
    }
  });
  
  /*
   * Collections
   */  
  var StudentList = Backbone.Collection.extend({
    model: Student,
    localStorage: new Backbone.LocalStorage("students-backbone"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });
  var AllStudents = new StudentList;
  var ParentList = Backbone.Collection.extend({
    model: Parent,
    localStorage: new Backbone.LocalStorage("parents-backbone"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });
  var AllParents = new ParentList;
  var TeacherList = Backbone.Collection.extend({
    model: Teacher,
    localStorage: new Backbone.LocalStorage("teachers-backbone"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });
  var AllTeachers = new TeacherList;
  var AssignmentList = Backbone.Collection.extend({
    model: Assignment,
    localStorage: new Backbone.LocalStorage("assignments-backbone"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });
  var AllAssignments = new AssignmentList;
  var CourseList = Backbone.Collection.extend({
    model: Course,
    localStorage: new Backbone.LocalStorage("courses-backbone"),
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },
    comparator: 'order'
  });
  var AllCourses = new CourseList;
  
  /*
   * Views
   */
  var AssignmentView = Backbone.View.extend({
    tagName:  "li",
    className: "assignment",
    template: _.template($('#assignment-template').html()),
    events: {
      "click a.delete" : "destroy",
      "input *"      : "edit"
    },
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('studentComplete', this.model.get('studentComplete'));
      this.$el.toggleClass('parentComplete', this.model.get('parentComplete'));
      this.input = this.$('.edit'); //Huh?
      return this;
    },
    
    //toggleStudentComplete: function() {
    //  this.model.toggleStudentComplete();
    //},
    //toggleParentComplete: function() {
    //  this.model.toggleParentComplete();
    //},

    lastEdited: new Date,
    edit: function() {
      this.lastEdited = new Date;
      if(!this.$el.hasClass("unsaved"))
        setTimeout(function(){
          view.save();
        }, autosaveDuration);
      this.$el.addClass("unsaved");
      var view = this;
    },
    save: function() {
      var view = this;
      if(this.lastEdited.getTime()+autosaveDuration < new Date().getTime()) {
        var value = this.input.val();
        this.model.save({
          name: this.$el.find("#name").text(),
          description: this.$el.find("#description").text(),
          dueDate: this.$el.find("#dueDate").text()
        });
        this.$el.removeClass("unsaved");
        this.lastEdited = new Date;
      } else {
        setTimeout(function(){
          view.save();
        }, 5);
      }
    },
    destroy: function() {
      var view = this;
      this.$el.slideUp("slow", function(){
        view.model.destroy();
      });
    }
  });
  var CourseView = Backbone.View.extend({
    tagName: "option",
    template: _.template($('#course-template').html()),
    events: {
      "click a": "select"
    },
    select: function(){
      // Change the display of the course view.
      AllCourses.
      this.$el.addClass();
      
      // Display the assignments for the given course.
      currentCourse = this.model;
      AssView.reset;
    }
  });
  
  /*
   * App views
   */
  var AssignmentsView = Backbone.View.extend({
    el: $("main#assignments"),
    events: {
      "click #new-assignment":  "create"
    },
    initialize: function() {
      this.listenTo(AllAssignments, 'add', this.add);
      this.listenTo(AllAssignments, 'reset', this.reset);

      AllAssignments.fetch();
    },
    add: function(assignment) {
      if(assignment.course == currentCourse) {
        var view = new AssignmentView({model: assignment});
        var newView = $(view.render().el);
      	this.$("#assignmentList").append(newView);
        newView.hide().slideDown("slow");
      }
    },
    reset: function() {
      this.$("#assignmentList").empty();
      if(currentCourse != null)
        currentCourse.assignments.each(this.add, this);
    },
    create: function() {
      if(currentCourse != null)
        AllAssignments.create({course: currentCourse});
    }
  });
  AssView = new AssignmentsView;
  /* 
  var UserView = Backbone.View.extend({
    el: $("#userList"),
    template: _.template($('#user-template').html()),
    initialize: function() {
      this.listenTo(AllStudents, 'add', this.addOne);
      this.listenTo(AllParents, 'add', this.addOne);      
      this.listenTo(AllTeachers, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      AllStudents.fetch();
      AllParents.fetch();
      AllTeachers.fetch();
      
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne, this);
    }
  });
  var UsView = new UserView;
  */
  
  /*
   * Dummy Users and Courses
   */
  var t1 = new Teacher({
    name: "Ms. Fitz"
  });
  AllTeachers.add(t1);
  var s1 = new Student({
    name: "Billy Klubbe"
  });
  AllStudents.add(s1);
  var p1 = new Parent({
    name: "Mr. Klubbe",
    children: [s1]
  });
  AllParents.add(p1);
  var c1 = new Course({
    name: "Introduction to Horse Whispering",
    students: [s1],
    teacher: t1
  });
  AllCourses.add(c1);
  
  currentCourse = c1;
  currentUser = s1;
});