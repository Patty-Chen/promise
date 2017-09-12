let asyncCall = function(callee, arg, retval) {
  retval = retval || {}
  if (typeof (callee) !== 'function') {return}
  if (typeof (process) === 'object' && process !== null && typeof(process.nextTick) === 'function'){
    process.nextTick(()=>{
      retval.x = callee(arg)
  })
  }
  else if (typeof (setImmediate) === 'function'){
    setImmediate(()=>{
      retval.x = callee(arg)
  })
  }
  else{
    setTimeout(()=>{
      retval.x = callee(arg)
  },0)
  }
}
let excuteCallback = function (callback, arg, retval, reject){
  asyncCall((arg)=>{
    try{
      return callback(arg)
    }
    catch(exception){
      reject(exception)
    }
  }, arg, retval)
}

let afterCallback = function (xReturned, oldPromise, resolve, reject){
  if (xReturned instanceof myPromise){
    if (xReturned === oldPromise){
      throw new TypeError('then is not allowed to return the promise itself')
    }
    xReturned.then(resolve,reject)
  }
  else{
    resolve(xReturned)
  }
}
const enumState = {PENDING:'pending',FULFILLED:'fulfilled',REJECTED:'rejected'}
const enumEvent = {RESOLVE:'resolve',REJECT:'reject'}

function myPromise(executor) {
  this.state = enumState.PENDING
  this.data = undefined
  this.onResolvedCallbacks = []
  this.onRejectedCallbacks = []

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
  try {
    if (srcPromise.state !== enumState.PENDING) {
      return
    }

    if (event === enumEvent.RESOLVE && srcPromise.onResolvedCallbacks.length !== 0) {
      //console.log('fsm run callback')
      srcPromise.state = enumState.FULFILLED
      //srcPromise.onResolved(data)
      srcPromise.onResolvedCallbacks.forEach((callback) => {
        let asyncRetval = {}
        asyncCall(callback, data, asyncRetval)
      }
    )

    }
    else if (event === enumEvent.RESOLVE && srcPromise.onResolvedCallbacks.length === 0) {
      //console.log('fsm run resolve')
      srcPromise.state = enumState.FULFILLED
      srcPromise.data = data
    }
    else if (event === enumEvent.REJECT && srcPromise.onRejectedCallbacks.length !== 0) {
      srcPromise.state = enumState.REJECTED
      //srcPromise.onRejected(data)
      srcPromise.onRejectedCallbacks.forEach((callback) => {
        let asyncRetval = {}
        asyncCall(callback, data, asyncRetval)
      }
    )
    }
    else if (event === enumEvent.REJECT && srcPromise.onRejectedCallbacks.length === 0) {
      srcPromise.state = enumState.REJECTED
      srcPromise.data = data
    }
  }
  catch (exception){
    console.log(exception)
  }
}

myPromise.prototype.then = function(onResolved,onRejected){
  let self = this
  let data = this.data
  onResolved = typeof(onResolved) === 'function' ? onResolved : null
  onRejected = typeof(onRejected) === 'function' ? onRejected : null

  if (this.state === enumState.PENDING){
    return new myPromise(function(resolve,reject){
      self.onResolvedCallbacks.push(function(value){
        try{
          let asyncRetval = {x:undefined};
          if (onResolved){
            excuteCallback(onResolved, value, asyncRetval, reject)
            asyncCall(()=>{
              afterCallback(asyncRetval.x, self, resolve, reject)
          })
          }
          else{
            resolve(value)
            return
          }
        }
        catch(exception){
          reject(exception)
        }
      })
      self.onRejectedCallbacks.push(function(reason){
        try{
          let asyncRetval = {x:undefined};
          if (onRejected){
            excuteCallback(onRejected, reason, asyncRetval, reject)
            asyncCall(()=>{
              afterCallback(asyncRetval.x, self, resolve, reject)
          })
          }
          else{
            reject(reason)
            return
          }
        }
        catch(exception){
          reject(exception)
        }
      })
    })
  }
  else if (this.state === enumState.FULFILLED){
    return new myPromise(function(resolve,reject){
      try{
        let asyncRetval = {x:undefined};
        if (onResolved){
          excuteCallback(onResolved, data, asyncRetval, reject)
          asyncCall(()=>{
            afterCallback(asyncRetval.x, self, resolve, reject)
        })
        }
        else{
          resolve(data)
          return
        }
      }
      catch(exception){
        console.log(exception)
        reject(exception)
      }
    })
  }
  else if (this.state === enumState.REJECTED){
    return new myPromise(function(resolve,reject){
      try{
        let asyncRetval = {x:undefined};
        if (onRejected){
          excuteCallback(onRejected, data, asyncRetval, reject)
          asyncCall(()=>{
            afterCallback(asyncRetval.x, self, resolve, reject)
        })
        }
        else{
          reject(data)
          return
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
