describe('method injection', function() {
  test('should work', async function() {
    class A {
      method() {}
    }

    const descriptor1 = Object.getOwnPropertyDescriptor(A.prototype, 'method');
    function a() {}
    Object.defineProperty(A.prototype, 'method', { value: a });
    const descriptor2 = Object.getOwnPropertyDescriptor(A.prototype, 'method');
    console.log(descriptor1!.value, descriptor2!.value, A.prototype.method)
  });
});
