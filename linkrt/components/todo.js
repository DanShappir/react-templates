(function () {
    'use strict';
    return {
        mixins: [React.addons.LinkedStateMixin],

        makeTodos: function (todos, counter) {
            return _.map(todos, function (todo) {
                return {value: todo, done: false, key: counter++};
            });
        },

        getInitialState: function () {
            var todos = this.props.todos ? this.makeTodos(this.props.todos, 0) : [];
            return {edited: '', todos: todos, counter: todos.length};
        },

        add: function () {
            var state = this.state;
            var edited = state.edited.trim();
            if (edited) {
                var todos = state.todos.concat(this.makeTodos([edited], state.counter));
                this.setState({todos: todos, edited: '', counter: state.counter + 1});
            }
        },

        remove: function (todo) {
            this.setState({todos: _.reject(this.state.todos, todo)});
        },

        toggleChecked: function (index) {
            var todos = _.cloneDeep(this.state.todos);
            todos[index].done = !todos[index].done;
            this.setState({todos: todos});
        },

        clearDone: function () {
            this.setState({todos: _.filter(this.state.todos, {done: false})});
        },

        componentDidUpdate: function () {
            this.refs.myinput.getDOMNode().focus();
        }
    };
}());
