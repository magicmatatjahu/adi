import { ADI } from '../src/adi';

describe('ADI class', function() {
  it('should create class', function() {
    const adi = new ADI();
    expect(adi).toBeInstanceOf(ADI);
  });
});