var MyComponent = React.createClass({
  handleClick: function() {
    // Explicitly focus the text input using the raw DOM API.
    React.findDOMNode(this.refs.myTextInput).focus();
  },
  render: function() {
    // The ref attribute adds a reference to the component to
    // this.refs when the component is mounted.
    return (
      <div>
        <input type="text" ref="myTextInput" />
        <input
          type="button"
          value="Focus the text input"
          onClick={this.handleClick}
        />
      </div>
    );
  }
});


var App = React.createClass({
   getInitialState: function() {
     return {userInput: ''};
   },
   handleChange: function(e) {
     this.setState({userInput: e.target.value});
   },

   clearAndFocusInput: function() {
     // Clear the input
     this.setState({userInput: ''}, function() {
       // This code executes after the component is re-rendered
       React.findDOMNode(this.refs.theInput).focus();   // Boom! Focused!
     });
   },
   render: function() {
     return (
       <div>
         <div onClick={this.clearAndFocusInput}>
           Click to Focus and Reset
         </div>
         <input
           ref="theInput"
           value={this.state.userInput}
           onChange={this.handleChange}
         />
       </div>
     );
   }
 });


/*Angular HelloWorld*/
var HelloWorld = React.createClass({

  getInitialState : function(){
    return {yourName:''};
  },

  handleState : function(e){
    this.setState({yourName: e.target.value});
  },

  render : function() {
    return (
      <div>
       <label>Name:</label>
       <input type="text"
         value={this.state.yourName}
         onChange={this.handleState} />
       <hr />
       <h1>Hello {this.state.yourName}!</h1>
      </div>
    );
  }
});


/*Angular Todo List*/
var AngularTodoList = React.createClass({

  loadTodoFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({items: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {items: []};
  },
  componentDidMount: function() {
    this.loadTodoFromServer();
    setInterval(this.loadTodoFromServer, this.props.pollInterval);
  },

  handleAdd: function() {
    var txt = this.refs.todoitem.getDOMNode().value;
    if(txt!=''){

      var todoitems = this.state.items;
      var todoItem = {text:txt,checked:false};
      todoitems.push(todoItem);

      this.setState({items: todoitems}, function() {
        // `setState` accepts a callback. To avoid (improbable) race condition,
        // `we'll send the ajax request right after we optimistically set the new
        // `state.
        $.ajax({
          url: this.props.url,
          dataType: 'json',
          type: 'POST',
          data:todoItem,
          success:function(data) {
            this.setState({items: data});
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });
      });

      this.refs.todoitem.getDOMNode().value = "";
    }
    React.findDOMNode(this.refs.todoitem).focus();
    return false;
  },
  handleRemove: function(i) {

    var todoitems = this.state.items;
    todoitems[i].checked = event.target.checked;
    var todoitem = {"id":i,"checked":event.target.checked};

    this.setState({items: todoitems}, function() {
      // `setState` accepts a callback. To avoid (improbable) race condition,
      // `we'll send the ajax request right after we optimistically set the new
      // `state.
      $.ajax({
        url: this.props.url,
        dataType: 'json',
        data:todoitem ,
        success: function(data) {
          this.setState({items: data});
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    });

  },
  render: function() {
    var items = this.state.items.map(function(item, i) {
      var ischecked = item.checked == "true" ? true : false;
      var cssChecked = ischecked ? "done-true" : "done-false";
      return (
        <li className="ui-state-default">
          <div className="checkbox">
            <label className={cssChecked}>
              <input
                  key={item.text}
                  type="checkbox"
                  checked={ischecked}
                  onChange={this.handleRemove.bind(this, i)}

              />
              {item.text}
            </label>
          </div>
        </li>
      );
    }.bind(this));

    var checked = this.state.items.filter(function(item,i){ return item.checked == "true";});
    var remaining = this.state.items.length - checked.length;
    return (
            <div className="todolist not-done">
                <h1>Todos</h1>
                <hr />
                <form className="form-inline">
                  <div className="form-group todo-form">
                    <input type="text" className="form-control add-todo" ref="todoitem" placeholder="Add todo" />
                    <button onClick={this.handleAdd} className="btn btn-success">Add Item</button>
                  </div>
                </form>
                <ol id="sortable" className="list-unstyled">
                  {items}
                </ol>
                <div className="todo-footer">
                 <strong><span className="count-todos">{remaining}</span></strong> Items Left of <strong>{this.state.items.length}</strong>
                </div>
            </div>
    );
  }
});



React.render(
  <AngularTodoList url="todo.json" pollInterval="2000" />,
  document.getElementById('content')
);
