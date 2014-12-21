var React = require('react');
var ReactPropTypes = React.PropTypes;
var CardComponent = require('../Cards');
var LayeredComponentMixin = require('mixins/LayeredComponentMixin');
var EndModal = require('./EndModal');
var Signup = require('./Signup');
var controller = require('./controller');
var PubSub = require('pubsub-js');
var constants = require('constants/AppConstants');
var localStorageKey = constants.localStorageKey;
var EventTypes = require('constants/EventTypes');
var DEAL_CARDS = EventTypes.DEAL_CARDS;
var $ = window.jQuery;


var Container  = React.createClass({

  mixins: [ LayeredComponentMixin ],

  getInitialState: function() {
    return {
      showModal: false,
      cardIndex: 0,
      fullCards: {},
      done: false,
      locked: false
    }
  },

  handleEndModal: function() {
    this.setState({showModal: !this.state.showModal});
  },

  componentDidMount: function() {

    if (this.isMounted()) {
      $.getJSON('data/cards.json', function(data) {
        console.log('Loading cards...');
        this.setState({fullCards: data});
        localStorage.setItem('cards', JSON.stringify(data));
      }.bind(this));
    } 

    PubSub.subscribe(DEAL_CARDS, function(msg, data) {
      console.log('Dealing cards');
      this.setState({done: false, locked: false, showModal: false});
      $('.carousel').carousel('next');
    }.bind(this));

  },

  setIndex: function(i) {
    this.setState({cardIndex: i});
  },

  formatCandidates: function(card, providedCandidates) {
    var res = [];
    providedCandidates.map(function(val, idx) {
      var o = {
        text: val,
        result: +card.answer === idx ? true : false
      };
      res.push(o);
    }, this);
    return controller.shuffleArray(res);
  },

  renderCards: function() {

    var cards = this.state.fullCards;
    var cardsArray = Object.keys(cards);
    var candidates;

    if (cards) {
      return cardsArray.map(function(hash, idx) {
        var originalVal = cards[hash];
        var cardIndex = ""+idx;
        candidates = this.formatCandidates(originalVal, originalVal.candidates);
        return (
            <div className={"item " + (this.state.cardIndex === idx ? "active" : "")} key={idx} >
              <div className="carousel-wrapped">
                <CardComponent
                  handleEndModal={this.handleEndModal}
                  cardIndex={cardIndex}
                  setIndex={this.setIndex}
                  cardsLength={cardsArray.length}
                  candidates={candidates}
                  hash={hash}
                  question={originalVal}
                  done={this.state.done}
                  locked={this.state.locked}
                />
              </div>
            </div>
          )
        }, this);
    } else {
      return <span></span>;
    }

  },

  renderLayer: function() {
      if (this.state.showModal && (this.props.modalType === 'endmodal')) {
        return (
            <EndModal onRequestClose={this.handleEndModal} />
        );
      } else if (this.state.showModal && (this.props.modalType === 'signup')) {
        return (
            <Signup onRequestClose={this.handleEndModal} />
        );
      } else {
        return <span/>;
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
        <div id="left"></div>
        <div id="right"></div>
        <div id="top"></div>
        <div id="bottom"></div>
        <Container modalType={this.props.modalType} />
        <a href="https://github.com/esbullington/canonicalcards">
          <img
            style="position: absolute; top: 0; right: 0; border: 0;"
            src="https://camo.githubusercontent.com/38ef81f8aca64bb9a64448d0d70f1308ef5341ab/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67"
            alt="Fork me on GitHub"
            data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png"
          />
        </a>
      </div>
    );
  }

});

module.exports = CardContainer;
