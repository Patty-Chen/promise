let asyncCall = function(callee) {
  let retval
  let _callee = callee
  if (typeof (callee) !== 'function') {return}
  if (typeof (process) === 'object' && process !== null && typeof(process.nextTick) === 'function'){
    process.nextTick(()=>{
      retval = _callee()
    })
  }
  else if (typeof (setImmediate) === 'function'){
    setImmediate(callee)
  }
  else{
    setTimeout(callee,0)
  }
  return retval
}

const enumState = {PENDING:'pending',FULFILLED:'fulfilled',REJECTED:'rejected'}
const enumEvent = {RESOLVE:'resolve',REJECT:'reject'}

function myPromise(executor) {
  this.state = enumState.PENDING
  this.data = undefined
  this.onResolved = undefined
  this.onRejected = undefined

  this.resolve = (value) => {
    runPromiseFSM(this, enumEvent.RESOLVE, value)
  }

  this.reject = (reason) => {
    runPromiseFSM(this, enumEvent.REJECT, reason)
  }

  executor(this.resolve, this.reject)

}

function runPromiseFSM(srcPromise, event, data){
  //console.log('runPromiseFSM')
  //console.log(srcPromise,event,data)
  if (srcPromise.state !== enumState.PENDING){return}

  if (event === enumEvent.RESOLVE && srcPromise.onResolved){
    //console.log('fsm run callback')
    srcPromise.state = enumState.FULFILLED
    //srcPromise.onResolved(data)
    asyncCall(srcPromise.onResolved.bind(srcPromise, data))
  }
  else if (event === enumEvent.RESOLVE && !srcPromise.onResolved){
    //console.log('fsm run resolve')
    srcPromise.state = enumState.FULFILLED
    srcPromise.data = data
  }
  else if (event === enumEvent.REJECT && srcPromise.onRejected){
    srcPromise.state = enumState.REJECTED
    //srcPromise.onRejected(data)
    asyncCall(srcPromise.onRejected.bind(srcPromise, data))
  }
  else if (event === enumEvent.REJECT && !srcPromise.onRejected){
    srcPromise.state = enumState.REJECTED
    srcPromise.data = data
  }
}

myPromise.prototype.then = function(onResolved,onRejected){
  let self = this
  let data = this.data
  //console.log('then')
  onResolved = typeof(onResolved) === 'function' ? onResolved : null
  onRejected = typeof(onRejected) === 'function' ? onRejected : null

  if (this.state === enumState.PENDING){
    //console.log('pending')
    return new myPromise(function(resolve,reject){
      self.onResolved = function(value){
        try{
          let x
          if (onResolved){
            x = asyncCall(onResolved.bind(self, value))
            //x = onResolved(value)
          }
          else{
            resolve(value)
            return
          }
          if (x === self){
            throw new TypeError('then is not allowed to return the promise itself')
          }
          if (x instanceof myPromise){
            x.then(resolve,reject)
          }
          else{
            resolve(x)
          }
        }
        catch(exception){
          reject(exception)
        }
      }
      self.onRejected = function(reason){
        try{
          let x
          if (onRejected) {
            x = asyncCall(onRejected.bind(self, reason))
            //x = onRejected(reason)
          }
          else{
            reject(reason)
            return
          }
          if (x === self){
            throw new TypeError('then is not allowed to return the promise itself')
          }
          if(x instanceof myPromise){
            x.then(resolve,reject)
          }
          else{
            resolve(x)
          }
        }
        catch(exception){
          reject(exception)
        }
      }
    })
  }
  else if (this.state === enumState.FULFILLED){
    //console.log('FULFILLED')
    return new myPromise(function(resolve,reject){
      try{
        let x = null
        if (onResolved){
          x = asyncCall(onResolved.bind(self, data))
          //x = onResolved(data)
        }
        else{
          resolve(data)
          return
        }
        console.log(x)
        if (x === self){
          throw new TypeError('then is not allowed to return the promise itself')
        }
        if (x instanceof myPromise){
          x.then(resolve,reject)
        }
        else{
          console.log('fullfilled resolved')
          resolve(x)
        }
      }
      catch(exception){
        comsole.log(exception)
        reject(exception)
      }
    })
  }
  else if (this.state === enumState.REJECTED){
    //console.log('rejected')
    return new myPromise(function(resolve,reject){
      try{
        let x
        if (onRejected){
          x = asyncCall(onRejected.bind(self, data))
          //x = onRejected(data)
        }
        else{
          reject(data)
          return
        }
        if (x === self){
          throw new TypeError('then is not allowed to return the promise itself')
        }
        if (x instanceof myPromise){
          x.then(resolve,reject)
        }
        else{
          resolve(x)
        }
      }
      catch(exception){
        reject(exception)
      }
    })
  }
}

adapter = {
  deferred : function() {
    let dfd = {};
    dfd.promise = new myPromise((resolve, reject) => {
      dfd.resolve = resolve;
    dfd.reject = reject;
  });
    return dfd;
  }
}

if (module && 'exports' in module) {
  module.exports = adapter;
}
