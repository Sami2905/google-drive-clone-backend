class ErrorHandler {
  private errors: Error[] = []
  private errorListeners: ((error: Error) => void)[] = []

  handleError(error: Error) {
    this.errors.push(error)
    this.notifyListeners(error)
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error)
    }
  }

  getErrors() {
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
  }

  addListener(listener: (error: Error) => void) {
    this.errorListeners.push(listener)
  }

  removeListener(listener: (error: Error) => void) {
    this.errorListeners = this.errorListeners.filter(l => l !== listener)
  }

  private notifyListeners(error: Error) {
    this.errorListeners.forEach(listener => listener(error))
  }
}

export const errorHandler = new ErrorHandler()
