'use strict';

/*jsl predef:define*/
/*jsl predef:it*/

var Validator = require('../lib/validator');
var should = require('chai').should();

describe('Attributes', function () {
  describe('type', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    describe('number', function () {
      it('should validate a valid number', function () {
        this.validator.validate(0, {'type': 'number', 'required': true}).valid.should.be.true;
      });

      it('should not validate an invalid number', function () {
        return this.validator.validate('0', {'type': 'number'}).valid.should.be.false;
      });

    });

    describe('required', function () {
      it('should not validate an undefined instance', function () {
        this.validator.validate(undefined, {'type': 'number', 'required': true}).valid.should.be.false;
      });
    });

    describe('null', function () {

      it('should validate null', function () {
        return this.validator.validate(null, {'type': 'null'}).valid.should.be.true;
      });

      it('should not validate no-null', function () {
        return this.validator.validate('0', {'type': 'null'}).valid.should.be.false;
      });

      // I don't know - strictly undefined should not be a valid null
      it('should not validate an undefined instance', function () {
        this.validator.validate(undefined, {'type': 'date', 'required': true}).valid.should.be.false;
      });
    });

    describe('date', function () {

      it('should validate date', function () {
        return this.validator.validate(new Date(), {'type': 'date'}).valid.should.be.true;
      });

      it('should not validate no-null', function () {
        return this.validator.validate('0', {'type': 'date'}).valid.should.be.false;
      });

      it('should not validate an undefined instance', function () {
        this.validator.validate(undefined, {'type': 'date', 'required': true}).valid.should.be.false;
      });
    });

    describe('integer', function () {

      it('should validate integer', function () {
        return this.validator.validate(12, {'type': 'integer'}).valid.should.be.true;
      });

      it('should not validate non integer', function () {
        return this.validator.validate(0.25, {'type': 'integer'}).valid.should.be.false;
      });

      it('should not validate an undefined instance', function () {
        this.validator.validate(undefined, {'type': 'integer', 'required': true}).valid.should.be.false;
      });
    });

    describe('boolean', function () {

      it('should validate true', function () {
        return this.validator.validate(true, {'type': 'boolean'}).valid.should.be.true;
      });

      it('should validate false', function () {
        return this.validator.validate(false, {'type': 'boolean'}).valid.should.be.true;
      });

      it('should not validate non boolean', function () {
        return this.validator.validate('true', {'type': 'boolean'}).valid.should.be.false;
      });

      it('should not validate an undefined instance', function () {
        this.validator.validate(undefined, {'type': 'boolean', 'required': true}).valid.should.be.false;
      });
    });

    describe('any', function () {

      it('should validate true as any', function () {
        return this.validator.validate(true, {'type': 'any'}).valid.should.be.true;
      });

      it('should validate "true" as any', function () {
        return this.validator.validate('true', {'type': 'any'}).valid.should.be.true;
      });

      it('should validate 0 as any', function () {
        return this.validator.validate(0, {'type': 'any'}).valid.should.be.true;
      });

      it('should validate Date as any', function () {
        return this.validator.validate(new Date(), {'type': 'any'}).valid.should.be.true;
      });

      it('should not validate an undefined instance', function () {
        this.validator.validate(undefined, {'type': 'any', 'required': true}).valid.should.be.false;
      });
    });
  });

  describe('minimum', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if number meets minimum', function () {
      return this.validator.validate(1, {'type': 'number', 'minimum': '1'}).valid.should.be.true;
    });

    it('should not validate if number is below minimum', function () {
      return this.validator.validate(0, {'type': 'number', 'minimum': '1'}).valid.should.be.false;
    });

    it('should validate if number is above minimum, using exclusiveMinimum', function () {
      return this.validator.validate(2, {'type': 'number', 'minimum': '1', 'exclusiveMinimum': true}).valid.should.be.true;
    });

    it('should not validate if number is the minimum, using exclusiveMinimum', function () {
      return this.validator.validate(1, {'type': 'number', 'minimum': '1', 'exclusiveMinimum': true}).valid.should.be.false;
    });

  });

  describe('maximum', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if number is below the maximum', function () {
      return this.validator.validate(1, {'type': 'number', 'maximum': '2'}).valid.should.be.true;
    });

    it('should not validate if number is above maximum', function () {
      return this.validator.validate(3, {'type': 'number', 'maximum': '2'}).valid.should.be.false;
    });

    it('should validate if number is below maximum, using exclusiveMinimum', function () {
      return this.validator.validate(1, {'type': 'number', 'maximum': '2', 'exclusiveMaximum': true}).valid.should.be.true;
    });

    it('should not validate if number is the maximum, using exclusiveMinimum', function () {
      return this.validator.validate(2, {'type': 'number', 'maximum': '2', 'exclusiveMaximum': true}).valid.should.be.false;
    });

  });

  describe('combined minimum and maximum', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if number is below the maximum', function () {
      return this.validator.validate(1, {'type': 'number', 'minimum': '1', 'maximum': '2'}).valid.should.be.true;
    });

    it('should not validate if number is above minumum', function () {
      this.validator.validate(3, {'type': 'number', 'minimum': '1', 'maximum': '2'}).valid.should.be.false;
    });
  });

  describe('dividibleBy', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if 0 is even', function () {
      return this.validator.validate(2, {'type': 'number', 'divisibleBy': 2}).valid.should.be.true;
    });

    it('should validate if -2 is even', function () {
      return this.validator.validate(-2, {'type': 'number', 'divisibleBy': 2}).valid.should.be.true;
    });

    it('should not validate 1 is even', function () {
      return this.validator.validate(1, {'type': 'number', 'divisibleBy': 2}).valid.should.be.false;
    });
  });

  describe('pattern', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if string matches the string pattern', function () {
      return this.validator.validate('abbbc', {'type': 'string', 'pattern': 'ab+c'}).valid.should.be.true;
    });

    it('should validate if string matches the regexp pattern', function () {
      return this.validator.validate('abbbc', {'type': 'string', 'pattern': /ab+c/}).valid.should.be.true;
    });

    it('should validate if string does not match the string pattern', function () {
      return this.validator.validate('abac', {'type': 'string', 'pattern': 'ab+c'}).valid.should.be.false;
    });

    it('should validate if string matches the string pattern zero', function () {
      return this.validator.validate(0, {'type': 'number', 'pattern': '[0-9]'}).valid.should.be.true;
    });

    it('should validate if null string', function () {
      return this.validator.validate(null, {'type': 'string', 'pattern': 'ab+c'}).valid.should.be.false;
    });
  });

  describe('minLength', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if string has a length larger than minLength', function () {
      return this.validator.validate('abcde', {'type': 'string', 'minLength': 5}).valid.should.be.true;
    });

    it('should not validate if string does has a length less than minLength', function () {
      return this.validator.validate('abcde', {'type': 'string', 'minLength': 6}).valid.should.be.false;
    });

    it('should validate if string is a zero and the minLength is 1', function () {
      return this.validator.validate(0, {'type': 'number', 'minLength': 1}).valid.should.be.true;
    });

    it('should not validate if string is null', function () {
      return this.validator.validate(null, {'type': 'string', 'minLength': 6}).valid.should.be.false;
    });
  });

  describe('maxLength', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if string has a length equal to maxLength', function () {
      return this.validator.validate('abcde', {'type': 'string', 'maxLength': 5}).valid.should.be.true;
    });

    it('should not validate if string does has a length larger than maxLength', function () {
      return this.validator.validate('abcde', {'type': 'string', 'maxLength': 4}).valid.should.be.false;
    });

    it('should validate if string is a zero and the maxLength is 0', function () {
      return this.validator.validate(0, {'type': 'number', 'maxLength': 0}).valid.should.be.false;
    });

    it('should not validate if string is null', function () {
      return this.validator.validate(null, {'type': 'string', 'maxLength': 6}).valid.should.be.false;
    });
  });

  describe('enum', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate if string is one of the enum values', function () {
      return this.validator.validate('abcde', {'type': 'string', 'enum': ['abcdf', 'abcde']}).valid.should.be.true;
    });

    it('should not validate if string is not one of the enum values', function () {
      return this.validator.validate('abcde', {'type': 'string', 'enum': ['abcdf', 'abcdd']}).valid.should.be.false;
    });

    it('should validate if number is one of the enum values', function () {
      return this.validator.validate(1, {'type': 'number', 'enum': [1, 2]}).valid.should.be.true;
    });

    it('should not validate if number is not one of the enum values', function () {
      return this.validator.validate(3, {'type': 'string', 'enum': [1, 2]}).valid.should.be.false;
    });

    it('should validate if value is undefined but defaults to one of the enum values', function () {
      return this.validator.validate(undefined, {'enum': ['foo', 'bar', 'baz'], 'default': 'baz'}).valid.should.be.true;
    });

    it('should not validate if value is undefined and required, even if a default is given', function () {
      return this.validator.validate(undefined, {'enum': ['foo', 'bar', 'baz'], 'required': true, 'default': 'baz'}).valid.should.be.false;
    });

    it('should not validate if a required field is omitted', function () {
      return this.validator.validate({}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'], 'required': true}}}).valid.should.be.false;
    });

    it('should not validate if a required field is undefined', function () {
      return this.validator.validate({'the_field':undefined}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'], 'required': true}}}).valid.should.be.false;
    });

    it('should validate if a required field has a value out of enum', function () {
      return this.validator.validate({'the_field':'bar'}, {'type': 'object', 'properties':{'the_field': {'enum': ['foo', 'bar', 'baz'], 'required': true}}}).valid.should.be.true;
    });

    it('should not validate if instance is null', function () {
      return this.validator.validate(null, {'type': 'string', 'enum': [1, 2]}).valid.should.be.false;
    });
  });

  describe('description', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should be ignored', function () {
      this.validator.validate(1, {'description': 'some text'}).valid.should.be.true;
    });
  });

  describe('disallow', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should prohibit specified types', function () {
      this.validator.validate(1, {'type': 'any', 'disallow':'array'}).valid.should.be.true;
    });

    it('should not prohibit unprohibited types', function () {
      this.validator.validate(1, {'type':'any', 'disallow':'array'}).valid.should.be.true;
    });
  });

  describe('dependencies', function () {
    beforeEach(function () {
      this.validator = new Validator();
    });

    it('should validate with missing non-depended properties', function () {
      this.validator.validate({foo: 1}, {'dependencies': {'quux': ['foo', 'bar']}}).valid.should.be.true;
    });

    it('should not validate with missing dependencies', function () {
      this.validator.validate({quux: 1, foo: 1}, {'dependencies': {'quux': ['foo', 'bar']}}).valid.should.be.false;
    });

    it('should validate with satisfied dependencies', function () {
      this.validator.validate({quux: 1, foo: 1, bar: 1}, {'dependencies': {'quux': ['foo', 'bar']}}).valid.should.be.true;
    });
  });

  describe('format', function () {
    beforeEach(function () {
      this.validator = new Validator();
      this.validator.addFormat('integer-positive', /^[0-9]+$/);
      this.validator.addFormat('alphanumeric', /^[a-zA-Z0-9]+$/);
    });

    it('should validate 1 as valid with integer-positive format', function () {
      return this.validator.validate(1, {'format': 'integer-positive'}, {}, {'propertyPath': 'apath'}).valid.should.be.true;
    });

    it('should validate 0 as valid with integer-positive format', function () {
      return this.validator.validate(0, {'format': 'integer-positive'}, {}, {'propertyPath': 'apath'}).valid.should.be.true;
    });

    it('should validate 2.1 as invalid with integer-positive format', function () {
      return this.validator.validate(2.1, {'format': 'integer-positive'}, {}, {'propertyPath': 'apath'}).valid.should.be.false;
    });

    it('should validate somename as valid with alphanumeric format', function () {
      return this.validator.validate('somename', {'format': 'alphanumeric'}, {}, {'propertyPath': 'apath'}).valid.should.be.true;
    });

    it('should validate null as valid with integer-positive format', function () {
      return this.validator.validate(null, {'format': 'integer-positive'}, {}, {'propertyPath': 'apath'}).valid.should.be.true;
    });

    it('should validate null as valid with alpha-numeric format', function () {
      return this.validator.validate(null, {'format': 'alphanumeric'}, {}, {'propertyPath': 'apath'}).valid.should.be.true;
    });
  });

  describe('oneOf', function() {
    beforeEach(function () {
      this.validator = new Validator();
    });

    describe('when there are 2 and only 2 subschemas with contradictory dependencies', function(){
      var schema = {
        oneOf:[
          {
            dependencies:{
              prop1:{
                properties:{
                  prop2: {
                    required: ['prop3']
                  }
                }
              }
            },
            properties:{
              prop1:{
                enum: ['1','2']
              }
            }
          },
          {
            dependencies:{
              prop1:{
                properties:{
                  prop2: {
                    not:{
                      required: ['prop3']
                    }
                  }
                }
              }
            },
            properties:{
              prop1:{
                enum:['3','4']
              }
            }
          }
        ]
      };

      describe('when instance fails dependency 1', function(){
        it('should return errors in subschemas with dependency 2', function(){
          var instance = {
            prop1: '1',
            prop2: {}
          };
          var result = this.validator.validate(instance, schema);
          result.errors.should.be.an('array');
          result.errors.length.should.equal(1);
          result.errors[0].property.should.equal('prop1');
          result.errors[0].message.should.equal('is not one of enum values: 3,4');
        });
      });

      describe('when instance fails dependency 2', function(){
        it('should return errors in subschemas with dependency 1', function(){
          var instance = {
            prop1: '3',
            prop2: {prop3:'something'}
          };
          var result = this.validator.validate(instance, schema);
          result.errors.should.be.an('array');
          result.errors.length.should.equal(1);
          result.errors[0].property.should.equal('prop1');
          result.errors[0].message.should.equal('is not one of enum values: 1,2');
        });
      });

      describe('when instance is valid', function(){
        it('should not return error', function(){
          var instance = {
            prop1: '1',
            prop2: {prop3:'something'}
          };
          var result = this.validator.validate(instance, schema);
          result.valid.should.be.true;
        });
      });
    });

    describe('when there are no subschemas with contradictory dependencies', function(){
      var schema = {
          oneOf:[
            {
              dependencies:{
                prop1:{
                  properties:{
                    prop2: {
                      required: ['prop3']
                    }
                  }
                }
              },
              properties:{
                prop1:{
                  enum: ['1','2']
                }
              }
            },
            {
              dependencies:{
                prop1:{
                  properties:{
                    prop2: {
                        required: ['prop4']
                    }
                  }
                }
              },
              properties:{
                prop1:{
                  enum:['3','4']
                }
              }
            }
          ]
      };

      describe('when instance is invalid', function(){
        it('should return generic error message', function(){
          var instance = {
            prop1: '',
            prop2: {}
          };
          var result = this.validator.validate(instance, schema);
          result.errors.should.be.an('array');
          result.errors.length.should.equal(1);
          result.errors[0].message.should.equal('is not exactly one from [subschema 0],[subschema 1]');
        });
      });

      describe('when instance is valid', function(){
        it('should not return error', function(){
          var instance = {
            prop1: '1',
            prop2: {prop3:'something'}
          };
          this.validator.validate(instance, schema).valid.should.be.true;
        })
      });
    });

    describe('when there are no subschemas with dependencies', function(){
      var schema = {
        oneOf:[
          {
            properties:{
              prop1:{
                enum: ['1','2']
              }
            }
          },
          {
            properties:{
              prop1:{
                enum:['3','4']
              }
            }
          }
        ]
      };

      describe('when instance is invalid', function(){
        it('should return specific error messages', function(){
          var instance = {
            prop1: '5',
            prop2: {}
          };
          var result = this.validator.validate(instance, schema);
          result.errors.should.be.an('array');
          result.errors.length.should.equal(2);
          result.errors[0].message.should.equal('is not one of enum values: 1,2');
          result.errors[1].message.should.equal('is not one of enum values: 3,4');
        });
      });

      describe('when instance is valid', function(){
        it('should not return error', function(){
          var instance = {
            prop1: '1',
            prop2: {prop3:'something'}
          };
          this.validator.validate(instance, schema).valid.should.be.true;
        })
      });
    });
  });

  describe('anyOf', function() {
    beforeEach(function () {
      this.validator = new Validator();
    });

    var schema = {
      anyOf:[
        {
          properties:{
            prop1:{
              enum: ['1','2']
            }
          }
        },
        {
          properties:{
            prop1:{
              enum:['2','3']
            }
          }
        }
      ]
    };

    describe('when instance is invalid', function(){
      it('should return specific error messages', function(){
        var instance = {
          prop1: '5',
          prop2: {}
        };
        var result = this.validator.validate(instance, schema);
        result.errors.should.be.an('array');
        result.errors.length.should.equal(2);
        result.errors[0].message.should.equal('is not one of enum values: 1,2');
        result.errors[1].message.should.equal('is not one of enum values: 2,3');
      });
    });

    describe('when instance is valid', function(){
      it('should not return error', function(){
        var instance = {
          prop1: '2',
          prop2: {prop3:'something'}
        };
        this.validator.validate(instance, schema).valid.should.be.true;
      })
    });
  });


  describe('not', function(){
    beforeEach(function () {
      this.validator = new Validator();
    });

    describe('when not type has required', function(){
      var schema = {
        not:{
          required: ['prop1']
        }
      };

      it('should return error with meaningful messsage', function(){
        var instance = {
          prop1: 'something'
        };
        var result = this.validator.validate(instance, schema);
        result.errors.should.be.an('array');
        result.errors.length.should.equal(1);
        result.errors[0].property.should.equal('prop1');
        result.errors[0].message.should.equal('can not be present');
      });
    });

    describe('when not type does not have required', function(){
      var schema = {
        properties: {
          prop1: {
            not: {
              type: 'string'
            }
          }
        }
      };

      it('should return error with generic error message', function(){
        var instance = {prop1: 'something'};
        var result = this.validator.validate(instance, schema, {propertyName: 'body'});
        result.errors.should.be.an('array');
        result.errors.length.should.equal(1);
        result.errors[0].property.should.equal('body.prop1');
        result.errors[0].message.should.equal('is of prohibited type [object Object]');
      });
    });
  });
});
