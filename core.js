
const enumState = {PENDING:'pending',FULFILLED:'fulfilled',REJECTED:'rejected'}
const enumEvent = {RESOLVE:'resolve',REJECT:'reject'}
console.log(enumState)

function myPromise(executor) {
  this.state = enumState.PENDING
  this.data = undefined
  this.onResolvedCallbacks = []
  this.onRejectedCallbacks = []
  this.resolve = (value) => {
    runPromiseFSM(this, enumEvent.resolve, value)
  }

  this.reject = (reason) => {
    runPromiseFSM(this, enumEvent.reject, reason)
  }

  executor(this.resolve, this.reject)
}

function runPromiseFSM(srcPromise, event, data){
    if (srcPromise.state !== enumState.PENDING){return}

    if (event === enumEvent.RESOLVE && srcPromise.onResolved){
        srcPromise.onResolved(data)
    }
    else if (event === enumEvent.RESOLVE && !srcPromise.onResolved){
        this.data = data
    }
    else if (event === enumEvent.REJECT && srcPromise.onRejected){
        srcPromise.onRejected(data)
    }
    else if (event === enumEvent.REJECT && !srcPromise.onRejected){
        this.data = data
    }
}

myPromise.prototype.then = function(onResolved,onRejected){
    let data = this.data
    onResolved = typeof(onResolved) === 'function' ? onResolved : null
    onRejected = typeof(onRejected) === 'function' ? onRejected : null

    if (this.state === enumState.PENDING){
        return new myPromise(function(resolve,reject){
            this.onResolved = function(){
                let x = asyncCall(onResolved(data))
                if (x instanceof myPromise){
                    x.then(resolve,reject)
                }
                else{
                    resolve(x)
                }
            }
            this.onRejected = function(){
                let x = onRejected(data)
                if(x instanceof myPromise){
                    x.then(resolve,reject)
                }
                else{
                    resolve(x)
                }
            }
            
        })
    }
    else if (this.state === enumState.FULFILLED){
        return new myPromise(function(resolve,reject){
            let x = onResolved(data)
            if (x instanceof myPromise){
                x.then(resolve,reject)
            }
            else{
                resolve(x)
            }
        })
    }
    else if (this.state === enumState.REJECTED){
         return new myPromise(function(resolve,reject){
            let x = onRejected(data)
            if (x instanceof myPromise){
                x.then(resolve,reject)
            }
            else{
                resolve(x)            
            }
        })
    }
}
