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
    template: _.template($('#assignment-template').html()),
    events: {
      "click a.delete" : "destroy",
      "input *"      : "save"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // Re-render the titles of the todo item.
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

    lastSaved: new Date,
    save: function() {
      if(lastSaved.getTime()+2000 < new Date.getTime()) {
        var value = this.input.val();
        this.model.save({
          name: this.$el.find("#name").val(),
          description: this.$el.find("#description").val(),
          dueDate: this.$el.find("#dueDate").val();
        });
        this.$el.removeClass("unsaved");
        lastSaved = new Date;
      } else {
        this.$el.addClass("unsaved");
      }
    },
    destroy: function() {
      this.model.destroy();
    }
  });
  var CourseView = Backbone.View.extend({
    tagName: "option",
    template: _.template($('#course-template').html()),
    events: {
      "click a": "select"
    },
    select: function(){
      //TODO Display the assignments for the given course.
    }
  });
  
  /*
   * Application
   */
  var AppView = Backbone.View.extend({
    el: $("body"),
    events: {
      "click #new-assignment":  "createOnEnter"
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },
    addOne: function(assignment) {
      var view = new AssignmentView({model: assignment});
      this.$("#assignmentList").append(view.render().el);
    },
    addAll: function() {
      AllAssignments.each(this.addOne, this);
    },
    create: function(e) {
      AllAssignments.create({course: currentCourse);
    }
  });
  var App = new AppView;
      
});