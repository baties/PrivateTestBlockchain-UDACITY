/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            console.log('Genesis Block Creation...') ;
            let block = new BlockClass.Block({data: 'Genesis Block'});
            console.log(block) ;
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            console.log('Chain Height is ' + this.height) ;
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        console.log('Add a new Block to the Chain ....') ;
        return new Promise(async (resolve, reject) => {
           block.height = self.chain.length ;
           block.time = new Date().getTime().toString().slice(0,-3) ;
           if (self.chain.length > 0) {
               block.previousBlockHash = self.chain[self.chain.length-1].hash ;
           }
           else{
               block.previousBlockHash = null ;
           }
           block.hash = SHA256(JSON.stringify(block)).toString() ;
           console.log(block) ;
           self.chain.push(block) ;
           self.height = self.height + 1 ;
           resolve(block) ;
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            let time = new Date().getTime().toString().slice(0, -3) ;
            let MessageOwnership = address + ':' + time + ':starRegistry' ;
            console.log('Chain Owner Ship : ') ;
            console.log(MessageOwnership) ;
            resolve(MessageOwnership) ;  
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        console.log('Submit Star .....') ;
        let self = this;
        return new Promise(async (resolve, reject) => {
            let messageTime = parseInt(message.split(':')[1]) ;
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3)) ;
            let eligibleTime = (5 * 60) ; // 5 Minutes 
            let elapsedTime = (currentTime - messageTime) ;
            console.log(elapsedTime) ;
            if (elapsedTime < eligibleTime) {
                console.log(message) ;
                console.log(address) ;
                console.log(signature) ;
                let isVerify = bitcoinMessage.verify(message, address, signature) ;
                if (isVerify) {
                    let data = {address: address, message: message, signature: signature, star: star} ;
                    console.log(data) ;
                    let newblock = new BlockClass.Block(data) ;
                    console.log(newblock) ;
                    await self._addBlock(newblock) ;
                    resolve(newblock) ;
                }
                else{
                    reject('The Block is not Verified !') ;
                }
            }
            else{
                reject(Error('More Than 5 Mins is not Allowed !')) ;
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        console.log('Get Block by Hash ....') ;
        let self = this;
        return new Promise((resolve, reject) => {
            console.log('Searching Hash is ' + hash) ;
            let Block = self.chain.find(p => (p.hash === hash)) ;
            if (Block != undefined){
                console.log(Block) ;
                resolve(Block) ;
            }
            else{
                console.log('Block is Not Found !') ;
                reject(Error('This Block Hash is not Found !')) ;
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        console.log('Get Block by Height ....') ;
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if(block){
                console.log(block) ;
                resolve(block);
            } else {
                console.log('This Block Height is Not Found !') ;
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress (address) {
        console.log('Get Star for Wallet Address :: ' + address) ;
        let self = this;
        let stars = [];
        return new Promise((resolve, reject) => {
            self.chain.forEach(block => {
                let bData = block.getBData() ;
                if (bData != undefined && bData.address == address) {
                    console.log('Block is Added ....') ;
                    stars.push(bData) ;
                }
            })
            console.log('The Chain is : ')
            console.log(stars) ;
            if (stars != []){
                resolve(stars) ;
            }
            else{
                reject(Error('No Stars with this Address is Found !')) ;
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        console.log('Chain Validatation .....') ;
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            self.chain.forEach((block, index) => {
                if (block.validate()){
                    if (block.height > 0){
                        let previousBlockHash = self.chain[index - 1].hash ;
                        if (block.previousBlockHash != previousBlockHash){
                            errorLog.push(block.height) ;
                        }
                    }
                }
                else {
                    errorLog.push(block.height) ;
                }
            })
            if (errorLog != []){
                resolve(errorLog) ;
            }
            else{
                resolve('The Chain is Validated, No Error is Found !') ;
            }
        });
    }

}

module.exports.Blockchain = Blockchain;   