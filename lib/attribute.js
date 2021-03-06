'use strict';

var helpers = require('./helpers');
var _ = require('lodash');

/** @type ValidatorResult */
var ValidatorResult = helpers.ValidatorResult;
/** @type SchemaError */
var SchemaError = helpers.SchemaError;

var attribute = {};

attribute.ignoreProperties = {
  // informative properties
  'id': true,
  'default': true,
  'description': true,
  'title': true,
  // arguments to other properties
  'exclusiveMinimum': true,
  'exclusiveMaximum': true,
  'additionalItems': true,
  // special-handled properties
  '$schema': true,
  '$ref': true,
  'extends': true
};

/**
 * @name validators
 */
var validators = attribute.validators = {};

/**
 * Validates whether the instance if of a certain type
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.type = function validateType (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  var types = (schema.type instanceof Array) ? schema.type : [schema.type];
  if (!types.some(this.testType.bind(this, instance, schema, options, ctx))) {
    return ((types.length == 1) ? "is not a " : "is none of ") + types.map(function (v) {
      return v.id && ('<' + v.id + '>') || (v+'');
    });
  }
  return null;
};

function testSchema(instance, options, ctx, schema){
  return this.validateSchema(instance, schema, options, ctx).valid;
}

function validateSchema(instance, options, ctx, schema){
  return this.validateSchema(instance, schema, options, ctx);
}

/*
* Remove the first not in schema if it exists.
* Return true if 'not' is found and removed. Otherwise return false.
* @return {boolean}
*/
function removeNot(schema){
  if (typeof schema === 'object'){
    if (schema.hasOwnProperty('not')){
      Object.keys(schema.not).forEach(function(propName){
        schema[propName] = schema.not[propName];
      });
      delete schema.not;

      return true;
    } else {
      if (Object.keys(schema).some(function(propName){
        return removeNot(schema[propName]);
      })){
        return true;
      };
    }
  }
  return false;
}

/**
* Test if oneOf has 2 and only 2 subschemas, which both contains
* dependencies. These 2 dependencies should be mutually exclusive.
* @param oneOf
* @return {boolean}
**/
function hasMutuallyExclusiveDependencies(oneOf){
  if (oneOf.length !== 2 || !oneOf[0].dependencies || !oneOf[1].dependencies){
    return false;
  }

  var dependency1 = oneOf[0].dependencies;
  var dependency2 = oneOf[1].dependencies;

  function areSubschemasMutuallyExclusive(subschemaName){
    if (!dependency2[subschemaName]){
      return false;
    }
    var subschema1 = _.cloneDeep(dependency1[subschemaName]);
    var subschema2 = _.cloneDeep(dependency2[subschemaName]);
    var subschema1HasNot = removeNot(subschema1);
    var subschema2HasNot = removeNot(subschema2);

    if (!subschema1HasNot && !subschema2HasNot)
    {
      return false;
    }

    if (!_.isEqual(subschema1, subschema2)){
      return false;
    }

    return true;
  }

  if(Object.keys(dependency1).every(areSubschemasMutuallyExclusive)){
    return true;
  };

  return false;
}

/**
* Test if oneOf has no dependencies, and therefore any subschema can apply
* @param oneOf
* @return {boolean}
**/
function hasNoDependencies(oneOf) {
  return !oneOf.some(function(subschema) { return typeof subschema.dependencies === 'object' });
}

/**
 * Validates whether the instance matches some of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.anyOf = function validateAnyOf (instance, schema, options, ctx) {
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!(schema.anyOf instanceof Array)){
    throw new SchemaError("anyOf must be an array");
  }

  var results = schema.anyOf.map(validateSchema.bind(this, instance, options, ctx));
  var errors = [];
  for (var index in results) {
    if (results[index].valid) {
      return null;
    }
    errors.push.apply(errors, results[index].errors);
  }
  return {
    errors: errors,
    instance: instance,
    propertyPath: ctx.propertyPath,
    schema: schema
  }
};

/**
 * Validates whether the instance matches every given schema
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.allOf = function validateAllOf (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!(schema.allOf instanceof Array)){
    throw new SchemaError("allOf must be an array");
  }
  var self = this;
  schema.allOf.forEach(function(v, i){
    var valid = self.validateSchema(instance, v, options, ctx);
    if(!valid.valid){
      var msg = (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '<subschema>';
      result.addError('does not match allOf schema ' + msg + ' with ' + valid.errors.length + ' error[s]:');
      result.importErrors(valid);
    }
  });
  return result;
};

/**
 * Validates whether the instance matches exactly one of the given schemas
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null}
 */
validators.oneOf = function validateOneOf (instance, schema, options, ctx) {
  var that = this, validationResult = null, validCount = 0, genericErrorMessage;

  function isDependencyError(error){
    return error.message.indexOf('dependency') > -1;
  }

  // Ignore undefined instances
  if (instance === undefined) {
    return null;
  }
  if (!(schema.oneOf instanceof Array)){
    throw new SchemaError("oneOf must be an array");
  }

  genericErrorMessage = "is not exactly one from " + schema.oneOf.map(function (v, i) {
    return (v.id && ('<' + v.id + '>')) || (v.title && JSON.stringify(v.title)) || (v['$ref'] && ('<' + v['$ref'] + '>')) || '[subschema '+i+']';
  });

  if (hasMutuallyExclusiveDependencies(schema.oneOf)){
    schema.oneOf.forEach(function(subschema){
      var result = that.validateSchema(instance, subschema, options, ctx);
      if (!result.valid){
        if(!result.errors.some(isDependencyError)){
          validationResult = result;
        }
      } else {
        validCount += 1;
      }
    });
  } else if (hasNoDependencies(schema.oneOf)) {
    var results = schema.oneOf.map(validateSchema.bind(this, instance, options, ctx));
    var errors = [];
    for (var index in results) {
      if (results[index].valid) {
        validCount++;
      }
      errors.push.apply(errors, results[index].errors);
    }
    if (validCount == 0) {
      validCount = errors.length;
      validationResult = {
        errors: errors,
        instance: instance,
        propertyPath: ctx.propertyPath,
        schema: schema
      }
    }
  } else {
    validCount = schema.oneOf.filter(testSchema.bind(this, instance, options, ctx)).length;
  }

  if (validCount !== 1) {
    return validationResult ? validationResult : genericErrorMessage;
  }
  return null;
};

/**
 * Validates properties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.properties = function validateProperties (instance, schema, options, ctx) {
  if(instance === undefined || !(instance instanceof Object)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var properties = schema.properties || {};
  for (var property in properties) {
    var prop = (instance || undefined) && instance[property];
    var res = this.validateSchema(prop, properties[property], options, ctx.makeChild(properties[property], property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
  return result;
};

/**
 * Test a specific property within in instance against the additionalProperties schema attribute
 * This ignores properties with definitions in the properties schema attribute, but no other attributes.
 * If too many more types of property-existance tests pop up they may need their own class of tests (like `type` has)
 * @private
 * @return {boolean}
 */
function testAdditionalProperty (instance, schema, options, ctx, property, result) {
  if (schema.properties && schema.properties[property] !== undefined) {
    return;
  }
  if (schema.additionalProperties === false) {
    result.addError("does not exist in the schema", property);
  } else {
    var additionalProperties = schema.additionalProperties || {};
    var res = this.validateSchema(instance[property], additionalProperties, options, ctx.makeChild(additionalProperties, property));
    if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
    result.importErrors(res);
  }
}

/**
 * Validates patternProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.patternProperties = function validatePatternProperties (instance, schema, options, ctx) {
  if(instance === undefined) return;
  if(!this.types.object(instance)) return;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var patternProperties = schema.patternProperties || {};

  for (var property in instance) {
    var test = true;
    for (var pattern in patternProperties) {
      var expr = new RegExp(pattern);
      if (!expr.test(property)) {
        continue;
      }
      test = false;
      var res = this.validateSchema(instance[property], patternProperties[pattern], options, ctx.makeChild(patternProperties[pattern], property));
      if(res.instance !== result.instance[property]) result.instance[property] = res.instance;
      result.importErrors(res);
    }
    if (test) {
      testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
    }
  }

  return result;
};

/**
 * Validates additionalProperties
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.additionalProperties = function validateAdditionalProperties (instance, schema, options, ctx) {
  if(instance === undefined) return;
  if(!this.types.object(instance)) return;
  // if patternProperties is defined then we'll test when that one is called instead
  if (schema.patternProperties) {
    return null;
  }
  var result = new ValidatorResult(instance, schema, options, ctx);
  for (var property in instance) {
    testAdditionalProperty.call(this, instance, schema, options, ctx, property, result);
  }
  return result;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minProperties = function validateMinProperties (instance, schema) {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  var keys = Object.keys(instance);
  if (!(keys.length >= schema.minProperties)) {
    return "does not meet minimum property length of " + schema.minProperties;
  }
  return null;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxProperties = function validateMaxProperties (instance, schema) {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  var keys = Object.keys(instance);
  if (!(keys.length <= schema.maxProperties)) {
    return "does not meet maximum property length of " + schema.maxProperties;
  }
  return null;
};

/**
 * Validates items when instance is an array
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.items = function validateItems (instance, schema, options, ctx) {
  if (!(instance instanceof Array)) {
    return null;
  }
  var self = this;
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (instance === undefined || !schema.items) {
    return result;
  }
  instance.every(function (value, i) {
    var items = (schema.items instanceof Array) ? (schema.items[i] || schema.additionalItems) : schema.items;
    if (items === undefined) {
      return true;
    }
    if (items === false) {
      result.addError("additionalItems not permitted");
      return false;
    }
    var res = self.validateSchema(value, items, options, ctx.makeChild(items, i));
    if(res.instance !== result.instance[i]) result.instance[i] = res.instance;
    result.importErrors(res);
    return true;
  });
  return result;
};

/**
 * Validates minimum and exclusiveMinimum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minimum = function validateMinimum (instance, schema) {
  if (typeof instance !== 'number') {
    return null;
  }
  var valid = true;
  if (schema.exclusiveMinimum && schema.exclusiveMinimum === true) {
    valid = instance > schema.minimum;
  } else {
    valid = instance >= schema.minimum;
  }
  if (!valid) {
    return "must have a minimum value of " + schema.minimum;
  }
  return null;
};

/**
 * Validates maximum and exclusiveMaximum when the type of the instance value is a number.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maximum = function validateMaximum (instance, schema) {
  if (typeof instance !== 'number') {
    return null;
  }
  var valid;
  if (schema.exclusiveMaximum && schema.exclusiveMaximum === true) {
    valid = instance < schema.maximum;
  } else {
    valid = instance <= schema.maximum;
  }
  if (!valid) {
    return "must have a maximum value of " + schema.maximum;
  }
  return null;
};

/**
 * Validates divisibleBy when the type of the instance value is a number.
 * Of course, this is susceptible to floating point error since it compares the floating points
 * and not the JSON byte sequences to arbitrary precision.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.divisibleBy = function validateDivisibleBy (instance, schema) {
  if (typeof instance !== 'number') {
    return null;
  }

  if (schema.divisibleBy == 0) {
    throw new SchemaError("divisibleBy cannot be zero");
  }

  if (instance / schema.divisibleBy % 1) {
    return "is not " + schema.divisibleBy;
  }
  return null;
};

/**
 * Validates divisibleBy when the type of the instance value is a number.
 * Of course, this is susceptible to floating point error since it compares the floating points
 * and not the JSON byte sequences to arbitrary precision.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.multipleOf = function validateMultipleOf (instance, schema) {
  if (typeof instance !== 'number') {
    return null;
  }

  if (schema.multipleOf == 0) {
    throw new SchemaError("multipleOf cannot be zero");
  }

  if (instance / schema.multipleOf % 1) {
    return "is not " + schema.multipleOf;
  }
  return null;
};

/**
 * Validates whether the instance value is present.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.required = function validateRequired (instance, schema, options, ctx) {
  if (schema.required === true && (typeof instance === "undefined" || instance === null)) {
    return "is required";
  }else if (instance && typeof instance==='object' && Array.isArray(schema.required)) {
    var result = new ValidatorResult(instance, schema, options, ctx);
    schema.required.forEach(function(n){
      if(typeof instance[n] === 'undefined' || instance[n] === null){
        var contextPropertyPath = ctx && ctx.propertyPath !== '' ? ctx.propertyPath + '.' : '';
        result.addError("is required", contextPropertyPath + n);
      }
    });
    return result;
  }
  return null;
};

/**
 * Validates whether the instance value matches the regular expression, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.pattern = function validatePattern (instance, schema) {
  if (typeof instance === 'undefined' || instance === null || (instance === '' && !schema.required)) {
    return null;
  }
  if (!new RegExp(schema.pattern).test(instance.toString())) {
    return "does not match pattern " + schema.pattern;
  }
  return null;
};

validators.addFormat = function addFormat(name, handler) {
  helpers.FORMAT_REGEXPS[name] = handler;
}

/**
 * Validates whether the instance value is of a certain defined format, when the instance value is a string.
 * The following format are supported:
 *   - date-time
 *   - date
 *   - time
 *   - ip-address
 *   - ipv6
 *   - uri
 *   - color
 *   - host-name
 *   - alpha
 *   - alpha-numeric
 *   - utc-millisec
 * @param instance
 * @param schema
 * @param [options]
 * @param [ctx]
 * @return {String|null}
 */
validators.format = function validateFormat (instance, schema, options, ctx) {
  if (typeof instance === 'undefined' ||  instance === null || (instance === '' && !schema.required)) {
    return null;
  }
  var isFormat = helpers.isFormat(instance.toString(), schema.format);
  if (isFormat !== true) {
    var message = "does not conform to the '" + schema.format + "' format";
    if (isFormat instanceof RegExp) {
      message += ", based on pattern: /" + isFormat.source + "/";
      return message;
    }  else if (typeof isFormat == 'string') {
      return isFormat;
    } else {
      return message;
    }
  }
  return null;
};

/**
 * Validates whether the instance value is at least of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minLength = function validateMinLength (instance, schema) {
  if (typeof instance === 'undefined' || instance === null) {
    return null;
  }
  if (!(instance.toString().length >= schema.minLength)) {
    return "does not meet minimum length of " + schema.minLength;
  }
  return null;
};

/**
 * Validates whether the instance value is at most of a certain length, when the instance value is a string.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxLength = function validateMaxLength (instance, schema) {
  if (typeof instance === 'undefined' || instance === null) {
    return null;
  }
  if (!(instance.toString().length <= schema.maxLength)) {
    return "does not meet maximum length of " + schema.maxLength;
  }
  return null;
};

/**
 * Validates whether instance contains at least a minimum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.minItems = function validateMinItems (instance, schema) {
  if (!(instance instanceof Array)) {
    return null;
  }
  if (!(instance.length >= schema.minItems)) {
    return "must contain at least " + schema.minItems;
  }
  return null;
};

/**
 * Validates whether instance contains no more than a maximum number of items, when the instance is an Array.
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.maxItems = function validateMaxItems (instance, schema) {
  if (!(instance instanceof Array)) {
    return null;
  }
  if (!(instance.length <= schema.maxItems)) {
    return "does not meet maximum length of " + schema.maxItems;
  }
  return null;
};

/**
 * Validates that every item in an instance array is unique, when instance is an array
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.uniqueItems = function validateUniqueItems (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!(instance instanceof Array)) {
    return result;
  }
  function testArrays (v, i, a) {
    for (var j = i + 1; j < a.length; j++) if (helpers.deepCompareStrict(v, a[j])) {
      return false;
    }
    return true;
  }
  if (!instance.every(testArrays)) {
    result.addError("contains duplicate item");
  }
  return result;
};

/**
 * Deep compares arrays for duplicates
 * @param v
 * @param i
 * @param a
 * @private
 * @return {boolean}
 */
function testArrays (v, i, a) {
  var j, len = a.length;
  for (j = i + 1, len; j < len; j++) {
    if (helpers.deepCompareStrict(v, a[j])) {
      return false;
    }
  }
  return true;
}

/**
 * Validates whether there are no duplicates, when the instance is an Array.
 * @param instance
 * @return {String|null}
 */
validators.uniqueItems = function validateUniqueItems (instance) {
  if (!(instance instanceof Array)) {
    return null;
  }

  if (!instance.every(testArrays)) {
    return "contains duplicate item";
  }
  return null;
};

/**
 * Validate for the presence of dependency properties, if the instance is an object.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.dependencies = function validateDependencies (instance, schema, options, ctx) {
  var result = new ValidatorResult(instance, schema, options, ctx);
  if (!instance || typeof instance != 'object') {
    return null;
  }
  for (var property in schema.dependencies) {
    if (instance[property] === undefined) {
      continue;
    }
    var dep = schema.dependencies[property];
    var childContext = ctx.makeChild(dep, property);
    if (typeof dep == 'string') {
      dep = [dep];
    }
    if (dep instanceof Array) {
      dep.forEach(function (prop) {
        if (instance[prop] === undefined) {
          result.addError("property " + prop + " not found, required by " + childContext.propertyPath);
        }
      });
    } else {
      var res = this.validateSchema(instance, dep, options, childContext);
      if(result.instance !== res.instance) result.instance = res.instance;
      if (res && res.errors.length) {
        result.addError("does not meet dependency required by " + childContext.propertyPath);
        result.importErrors(res);
      }
    }
  }
  return result;
};

/**
 * Validates whether the instance value is one of the enumerated values.
 *
 * @param instance
 * @param schema
 * @return {String|null}
 */
validators.enum = function validateEnum (instance, schema) {
  if (!(schema.enum instanceof Array)) {
    throw new SchemaError("enum expects an array", schema);
  }
  if (instance === undefined || instance === null || (instance === '' && !schema.required)) {
    return null;
  }
  if (!schema.enum.some(helpers.deepCompareStrict.bind(null, instance))) {
    return "is not one of enum values: " + schema.enum;
  }
  return null;
};

/**
 * Validates whether the instance if of a prohibited type.
 * @param instance
 * @param schema
 * @param options
 * @param ctx
 * @return {String|null|ValidatorResult}
 */
validators.not = validators.disallow = function validateNot (instance, schema, options, ctx) {
  var self = this;
  if(instance === undefined) return null;
  var result = new ValidatorResult(instance, schema, options, ctx);
  var notTypes = schema.not || schema.disallow;
  if(!notTypes) return null;
  if(!(notTypes instanceof Array)) notTypes=[notTypes];
  notTypes.forEach(function (type) {
    if (self.testType(instance, schema, options, ctx, type)) {
      if (type.required && Array.isArray(type.required)){
        type.required.forEach(function(requiredProp){
          result.addError('can not be present', ctx.propertyPath ? ctx.propertyPath + '.' + requiredProp : requiredProp);
        })
      } else {
        var schemaId = type && type.id && ('<' + type.id + '>') || type;
        result.addError("is of prohibited type " + schemaId);
      }
    }
  });
  return result;
};

module.exports = attribute;
