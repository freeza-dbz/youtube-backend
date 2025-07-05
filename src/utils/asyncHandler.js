const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise
      .resolve(requestHandler(req, res, next))
      .catch((err) => next(err))
  }
}

export { asyncHandler }


















//when using async handler if an reeoe occur (like a rejected promise) express dosen't catches itself so we have to uuse try and catch
//this code wrap here helps to prevent the writing of try catch block everywhere 

// const asyncHandler = () => { }
// const asyncHandler = (func) => { () => { } } // can skip the use of second curly bracket
// const asyncHandler = (func) => async () => { }


// const asyncHandler = (func) => async (req, res, next) => {
//   try {
//     await func(req, res, next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }