describe('Mockgoose Tests', function () {
    "use strict";

    var mockgoose = require('../Mockgoose');
    var mongoose = require('mongoose');
    mockgoose(mongoose);
    mongoose.createConnection('mongodb://localhost:3001/TestingDB');
    var AccountModel = require('./models/AccountModel')(mongoose);
    var SimpleModel = require('./models/SimpleModel')(mongoose);

    beforeEach(function (done) {
        mockgoose.reset();
        AccountModel.create(
            {email: 'valid@valid.com', password: 'password'},
            {email: 'invalid@invalid.com', password: 'password'},
            function (err, models) {
                expect(err).toBeFalsy();
                expect(models).toBeTruthy();
                SimpleModel.create(
                    {name: 'one', value: 'one'},
                    {name: 'one', value: 'two'},
                    {name: 'one', value: 'two'},
                    {name: 'two', value: 'one'},
                    {name: 'two', value: 'two'},
                    function (err, models) {
                        expect(err).toBeFalsy();
                        expect(models).toBeTruthy();
                        done(err);
                    }
                );
            });

    });

    afterEach(function (done) {
        //Reset the database after every test.
        mockgoose.reset();
        done();
    });

    it('should be able to require mockgoose', function () {
        expect(mockgoose).toBeTruthy();
    });

    it('should be able to create and save test model', function (done) {
        AccountModel.create({email: 'email@email.com', password: 'supersecret'}, function (err, model) {
            expect(err).toBeFalsy();
            expect(model).toBeTruthy();
            done(err);
        });
    });

    it('should be able to invoke validator on a test model', function (done) {
        //Email needs to be unique!
        AccountModel.create({email: 'valid@valid.com', password: 'supersecret'}, function (err, model) {
            expect(err).toBeTruthy();
            expect(model).toBeFalsy();
            done();
        });

    });

    it('should be able to call custom save pre', function (done) {
        AccountModel.create({email: 'newemail@valid.com', password: 'password'}, function (err, model) {
            //Custom pre save should encrypt the users password.
            expect(model.password).not.toBe('password');
            model.validPassword('password', function (err, success) {
                expect(success).toBeTruthy();
                expect(err).toBeFalsy();
                done(err);
            });

        });
    });

    it('should be able to create multiple items in one go', function (done) {
        AccountModel.create({email: 'one@one.com', password: 'password'},
            {email: 'two@two.com', password: 'password'}, function (err, one, two) {
                expect(err).toBeFalsy();
                expect(one).toBeTruthy();
                expect(two).toBeTruthy();
                done(err);
            });
    });

    it('should be able to find an item by id', function (done) {
        AccountModel.create({email: 'one@one.com', password: 'password'},
            {email: 'two@two.com', password: 'password'}, function (err, one, two) {
                expect(err).toBeFalsy();
                AccountModel.findById(two._id, function (err, model) {
                    expect(err).toBeFalsy();
                    expect(model._id.toString()).toBe(two._id.toString());
                    done(err);
                });
            });
    });

    it('should be able to findOne model by using a simple query', function (done) {
        AccountModel.findOne({email: 'valid@valid.com'}, function (err, model) {
            expect(err).toBeFalsy();
            expect(model.email).toBe('valid@valid.com');
            done(err);
        });
    });

    it('should be able to findOne model by using a slightly complex query', function (done) {
        SimpleModel.findOne({name: 'one', value: 'two'}, function (err, model) {
            expect(err).toBeFalsy();
            expect(model.name).toBe('one');
            expect(model.value).toBe('two');
            done(err);
        });
    });

    it('should be able to find multiple model by using a simple query', function (done) {
        SimpleModel.find({name: 'one'}, function (err, models) {
            expect(err).toBeFalsy();
            expect(models.length).toBe(3);
            done(err);
        });
    });

    it('should be able to find multiple model by using a slightly complex query', function (done) {
        SimpleModel.find({name: 'one', value:'two'}, function (err, models) {
            expect(err).toBeFalsy();
            expect(models.length).toBe(2);
            done(err);
        });
    });

    it('should be able to find all models of a certain type', function (done) {
        SimpleModel.findAll(function (err, models) {
            expect(err).toBeFalsy();
            expect(models.length).toBe(5);
            done(err);
        });
    });

    it('should be able to remove a model', function (done) {
        SimpleModel.remove({name: 'one'}, function (err, models) {
            expect(err).toBeFalsy();
            expect(models.length).toBe(3);
            SimpleModel.findOne({name: 'one'}, function (err, model) {
                expect(err).toBeFalsy();
                expect(model).toBeFalsy();
                done(err);
            });
        });
    });

    it('should be able to remove a model from a model object', function (done) {
        SimpleModel.find({name: 'one'}, function (err, result) {
            expect(err).toBeFalsy();
            expect(result.length).toBe(3);
            result[0].remove(function (err, model) {
                expect(err).toBeFalsy();
                expect(model).toBeDefined();
                SimpleModel.find({name:'one'}, function(err, models){
                    expect(err).toBeFalsy();
                    expect(models.length).toBe(2);
                    done(err);
                });
            });
        });
    });

    it('should be able to remove multiple model', function (done) {
        AccountModel.remove({email: 'valid@valid.com'}, function (err, model) {
            expect(err).toBeFalsy();
            expect(model.email).toBe('valid@valid.com');
            AccountModel.findOne({email: 'valid@valid.com'}, function (err, model) {
                expect(err).toBeFalsy();
                expect(model).toBeFalsy();
                done(err);
            });
        });
    });

    it('should be able to find a model $in', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:['one', 'two']},
            {email: 'multiples@invalid.com', password: 'password', values:['two', 'three']},
            function (err, models) {                
                AccountModel.findOne({values:{$in:['three']}}, function(err, result){
                    expect(result).toBeDefined();
                    if(result){
                        expect(result.values[1]).toBe('three');    
                    }
                    done(err);
                });
            });
    });

    it('should be able to find models $in with more than one value', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:['one', 'two']},
            {email: 'multiples@invalid.com', password: 'password', values:['two', 'three']},
            function (err, models) {
                AccountModel.find({values:{$in:['two']}}, function(err, result){
                    expect(result).toBeDefined();;
                    if(result){
                        expect(result.length).toBe(2);    
                    }
                    done(err);
                });
            });
    });


    it('should be able to find models $in with multiple values', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:['one', 'two']},
            {email: 'multiples@invalid.com', password: 'password', values:['two', 'three']},
            function (err, models) {                
                AccountModel.find({values:{$in:['two', 'three']}}, function(err, result){
                    expect(result).toBeDefined();
                    if(result){
                        expect(result.length).toBe(2);    
                    }
                    done(err);
                });
            });
    });

    it('should be able to update models', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:['one','two']},
            function (err, model) {                
                AccountModel.findOneAndUpdate({email:'multiples@valid.com'}, {email:'updatedemail'}, function(err, result){
                    expect(result).toBeDefined();
                    if(result){
                        expect(result.email).toBe('updatedemail');    
                    }
                    done(err);
                });
            });
    });

    it('should be able to update multiple values in models', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:['one', 'two']},
            function (err, model) {                
                AccountModel.findOneAndUpdate({email:'multiples@valid.com'}, {email:'updatedemail', password:'updated'}, function(err, result){
                    expect(result).toBeDefined();
                    if(result){
                        expect(result.email).toBe('updatedemail');    
                        expect(result.password).toBe('updated');    
                    }
                    done(err);
                });
            });
    });

    iit('should be able to pull items from nested documents array', function (done) {
        AccountModel.create(
            {email: 'tester@valid.com', password: 'password', values:['one', 'two']},
            function (err, model) {   
                AccountModel.findOneAndUpdate({email:'tester@valid.com'}, {$pull:{values:'one'}}, function(err, result){
                    expect(result).toBeDefined();
                    if(result){    
                        expect(result.values.length).toBe(1);    
                        expect(result.values[0]).toBe('two');    
                    }
                    done(err);
                });
            });
    });

    it('should be able to pull items from nested documents array by property', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:[{name:'one'}, {name:'two'}]},
            function (err, model) {                
                AccountModel.findOneAndUpdate({email:'multiples@valid.com'}, {$pull:{values:{name:{$in:['one']}}}}, function(err, result){
                    expect(result).toBeDefined();
                    if(result){    
                        expect(result.values.length).toBe(1);    
                        expect(result.values[0].name).toBe('two');    
                    }
                    done(err);
                });
            });
    });

    it('should be able to pull multiple items from nested documents array by property', function (done) {
        AccountModel.create(
            {email: 'multiples@valid.com', password: 'password', values:[{name:'one'}, {name:'two'}, {name:'three'}]},
            function (err, model) {                
                AccountModel.findOneAndUpdate({email:'multiples@valid.com'}, {$pull:{values:{name:{$in:['one', 'two']}}}}, function(err, result){
                    expect(result).toBeDefined();
                    console.log('Results are ---- ', result);
                    if(result){    
                        expect(result.values.length).toBe(1);    
                        expect(result.values[0].name).toBe('three');    
                    }
                    done(err);
                });
            });
    });


});