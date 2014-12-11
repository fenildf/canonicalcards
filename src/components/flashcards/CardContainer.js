var React = require('react');
var ReactPropTypes = React.PropTypes;
var Router = require('react-router');
var Link = Router.Link;
var Firebase = require("firebase");
var CardItem = require('./CardItem');
var firebaseRef = new Firebase("https://flashcardsapp.firebaseio.com/");
var $ = window.jQuery;

/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

var Container  = React.createClass({

  getInitialState: function() {
    return {
      index: 0,
      direction: null,
      cards: []
    }
  },

  componentDidMount: function() {

    if (this.isMounted()) {
      firebaseRef.child('cards').on('value', function(snapshot) {
        this.setState({cards: snapshot.val()});
      }.bind(this));
    }

  },

  setIndex: function(i) {
    this.setState({index: i});
  },

  formatCandidates: function(question, cards) {
    var res = [];
    Object.keys(cards).map(function(val, idx) {
      var o = {
        hash: val,
        text: cards[val].answer,
        result: cards[val].question === question ? true : false
      };
      res.push(o);
    }, this)
    return shuffleArray(res);
  },

  renderCards: function() {

    var cards = this.state.cards;

    if (cards) {
      return Object.keys(cards).map(function(val, idx) {
        return (
            <div className={"item " + (this.state.index === idx ? "active" : "")} key={idx} >
              <div className="carousel-wrapped">
                <h3>{cards[val].question}</h3>
                <CardItem setIndex={this.setIndex} candidates={this.formatCandidates(cards[val].question, cards)} hash={val} question={cards[val]} />
              </div>
            </div>
          )
        }, this);
    } else {
      return <span></span>;
    }

  },

  render: function () {

    return  (
      <div id="carousel-example-generic" className="carousel slide" data-ride="carousel" data-interval={false} data-wrap={false} >
        <div className="carousel-inner" role="listbox"  >
        {this.renderCards()}
        </div>
      </div>
    );

  }

});


var CardContainer = React.createClass({

  render: function() {
    return (
      <div className="card-container">
        <Container />
        <span id="ribbon"><Link to="dashboard">Dashboard</Link></span>
      </div>
    );
  }

});

module.exports = CardContainer;
