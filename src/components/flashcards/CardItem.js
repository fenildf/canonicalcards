var React = require('react');
var ReactPropTypes = React.PropTypes;
var Firebase = require('firebase');
var ref = new Firebase("https://flashcardsapp.firebaseio.com/");
var constants = require('../../constants/AppConstants');
var localStorageKey = constants.localStorageKey;
var spacedRepetition = require('./spacedRepetition');
var $ = window.jQuery;


function getRepIntervalAndQuestionDate(attemptedQuestions, grade, val) {
  var repIntervalAndQuestionDate;
  var lastRepetitionInterval = val ? val.lastRepetitionInterval: 1;
  var easinessFactor = val && val.easinessFactor ? val.easinessFactor: 2.5;
  var i = spacedRepetition.getNextRepetitionInterval(attemptedQuestions, grade, lastRepetitionInterval, easinessFactor);
  console.log('next rep interval', i);
  var today = new Date();
  var nextQuestionDate = today.getTime() + (24*60*60*1000*i); 
  repIntervalAndQuestionDate = {
    lastRepetitionInterval: i,
    nextQuestionDate: nextQuestionDate
  };
  return repIntervalAndQuestionDate;
}

var CardItem = React.createClass({

  getInitialState: function() {
    return {
      done: false,
      isCorrect: null,
      auth: null,
      settings: null,
      startTime: 0
    };
  },

  recordAnswer: function(hash, result, grade) {
    var self = this;
    if (this.state.auth) {
      var counterRef = ref.child('users').child(this.state.auth.uid).child(hash);
      counterRef.once('value', function(snapshot) {
        var val = snapshot.val();
        var attemptedQuestions = val ? val.attemptedQuestions += 1: 1;
        if (result) {
          var correctQuestions = val? val.correctQuestions += 1: 1;
        } else {
          var correctQuestions = val ? val.correctQuestions: 0;
        }
        var o = getRepIntervalAndQuestionDate(attemptedQuestions, grade, val);
        var hesitationInterval = (new Date().getTime()) - self.state.startTime;
        var hesitation = val && val.hesitation ? val.hesitation + ';' + hesitationInterval.toString() : hesitationInterval.toString();
        console.log('hesitation', hesitation);
        var toSave = {
          correctQuestions: correctQuestions,
          attemptedQuestions: attemptedQuestions,
          lastRepetitionInterval: o.lastRepetitionInterval,
          nextQuestionDate: o.nextQuestionDate,
          hesitation: hesitation
        };
        counterRef.set(toSave, function(error) {
          if (error) {
            console.log('error saving results');
          }
        });
      });
    }
  },

  checkAnswer: function(e) {
    e.preventDefault;
    var i = +e.target.value;
    // We've pre-checked the array of answer candidates for the correct answer
    // So we only have to check if the pre-checked result is true
    var thisAnswerCandidate = this.props.candidates[i];
    if (thisAnswerCandidate.result) {
      this.setState({isCorrect: true});
      console.log('Answer is: ', true);
    } else {
      console.log('Answer is: ', false);
      this.setState({isCorrect: false});
    }
    this.setState({done: true});
  },

  checkSRSAnswer: function(e) {
    e.preventDefault;
    var i = +e.target.value;
    // We've pre-checked the array of answer candidates for the correct answer
    // So we only have to check if the pre-checked result is true
    var thisAnswerCandidate = this.props.candidates[i];
    if (thisAnswerCandidate.result) {
      this.setState({isCorrect: true});
      console.log('Answer is: ', true);
    } else {
      console.log('Answer is: ', false);
      this.setState({isCorrect: false});
    }
    this.setState({done: true});
  },

  advanceFrame: function() {
    this.setState({done: false, isCorrect: false});
    console.log('clicked!');
    $('.carousel').carousel('next');
  },

  componentDidMount: function(e) {
    if (this.isMounted()) {
      var now = new Date();
      this.setState({startTime: now.getTime()});
      var auth = JSON.parse(localStorage.getItem(localStorageKey));
      this.setState({auth: auth});
      var settingsRef = ref.child('users').child(auth.uid).child('settings');
      settingsRef.once('value', function(snapshot) {
        var settings = snapshot.val();
        this.setState({settings: settings});
      }, this);
    }
  },

  checkGrade: function(e) {
    e.preventDefault;
    var grade = +e.target.value;
    console.log("Grade: " + grade);
    if (this.state.isCorrect !== null) {
      this.recordAnswer(this.props.question.hash, this.state.isCorrect, grade);
    }
  },

  renderGrades: function(isCorrect) {
    var correctGrades = {
      3: 'correct response recalled with serious difficulty',
      4: 'correct response after a hesitation',
      5: 'perfect response'
    };
    var incorrectGrades = {
      0: 'complete blackout',
      1: 'incorrect response; the correct one remembered',
      2: 'incorrect response; where the correct one seemed easy to recall',
    };
    if (isCorrect) {
      return (
          <div>
          {Object.keys(correctGrades).map(function(val, idx) {
            return (
              <div key={idx} >
                <label>
                  <input onClick={this.checkGrade} type="radio" id="possibleGrades" name="grades" value={val} style={{"display":"none"}} />
                  {correctGrades[val]}
                </label> 
              </div>
                )
            }, this)
          }
          </div>
        );
    } else {
      return (
          <div>
          {Object.keys(incorrectGrades).map(function(val, idx) {
            return (
              <div key={idx} >
                <label>
                  <input onClick={this.checkGrade} type="radio" id="possibleGrades" name="grades" value={val} style={{"display":"none"}} />
                  {incorrectGrades[val]}
                </label> 
              </div>
                )
            }, this)
          }
          </div>
        );
    }
  },

  renderResult: function() {
    if (this.state.done && this.state.settings) {
      // First, the render right/wrong paths for those not wanting SRS
      if (!this.state.settings.srs && this.state.isCorrect) {
        return (
            <div>
              <div>Right!</div>
              <button onClick={this.advanceFrame} className="btn btn-default">Next</button>
            </div>
          );
      } else if (!this.state.settings.srs) {
        return (
            <div>
              <div>Wrong: </div>
              <button onClick={this.advanceFrame} className="btn btn-default">Next</button>
            </div>
          );
      }
      // For SRS results
      if (this.state.settings.srs && this.state.isCorrect) {
        var isCorrect = this.state.isCorrect;
        return (
            <div>
              <div>Right!</div>
              {this.renderGrades(isCorrect)}
              <button onClick={this.advanceFrame} className="btn btn-default">Next</button>
            </div>
          );
      } else if (this.state.settings.srs) {
        return (
            <div>
              <div>Wrong! The correct answer is: {this.props.question.answer} </div>
              {this.renderGrades(isCorrect)}
              <button onClick={this.advanceFrame} className="btn btn-default">Next</button>
            </div>
          );
      }
    }
  },

  render: function() {

  	return (
      <div>
        {this.props.candidates.map(function(el, idx) {
          return (
            <div key={idx} >
              <label>
                <input onClick={this.checkSRSAnswer} type="radio" id="possibleAnswers" name="candidates" value={idx} style={{"display":"none"}} />
                {el.text}
              </label> 
            </div>
              )
          }, this)
        }

        {this.renderResult()}

      </div>
    );
  },

});

module.exports = CardItem;
