import { getDecoratorType } from "../../src/di/utils";
import { DecoratorType } from "../../src/di/enums";
import { expect } from 'chai';

describe('getDecoratorType (util)', () => {
  let type: DecoratorType = undefined;
  function Decorate() {
    return function(target: Object, key?: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
      type = getDecoratorType(target, key, indexOrDescriptor);
    }
  }

  it('CLASS decorator', () => {
    @Decorate()
    class Class {}

    expect(type).to.be.equal(DecoratorType.CLASS);
  });

  it('PROPERTY decorator', () => {
    class Class {
      @Decorate()
      public property;
    }

    expect(type).to.be.equal(DecoratorType.PROPERTY);
  });

  it('STATIC_PROPERTY decorator', () => {
    class Class {
      @Decorate()
      public static property;
    }

    expect(type).to.be.equal(DecoratorType.STATIC_PROPERTY);
  });

  it('METHOD_PARAMETER decorator', () => {
    class Class {
      public method(@Decorate() param: any) {}
    }

    expect(type).to.be.equal(DecoratorType.METHOD_PARAMETER);
  });

  it('CONSTRUCTOR_PARAMETER decorator', () => {
    class Class {
      constructor(
        @Decorate() param: any,
      ) {}
    }

    expect(type).to.be.equal(DecoratorType.CONSTRUCTOR_PARAMETER);
  });

  it('STATIC_PARAMETER decorator', () => {
    class Class {
      public static method(@Decorate() param: any) {}
    }

    expect(type).to.be.equal(DecoratorType.STATIC_PARAMETER);
  });

  it('METHOD decorator', () => {
    class Class {
      @Decorate()
      public method() {}
    }

    expect(type).to.be.equal(DecoratorType.METHOD);
  });

  it('STATIC_METHOD decorator', () => {
    class Class {
      @Decorate()
      public static method() {}
    }

    expect(type).to.be.equal(DecoratorType.STATIC_METHOD);
  });

  it('GETTER_ACCESSOR decorator', () => {
    class Class {
      @Decorate()
      get accessor() { return undefined }
    }

    expect(type).to.be.equal(DecoratorType.GETTER_ACCESSOR);
  });

  it('STATIC_GETTER_ACCESSOR decorator', () => {
    class Class {
      @Decorate()
      static get accessor() { return undefined }
    }

    expect(type).to.be.equal(DecoratorType.STATIC_GETTER_ACCESSOR);
  });

  it('SETTER_ACCESSOR decorator', () => {
    class Class {
      @Decorate()
      set accessor(param: any) {}
    }

    expect(type).to.be.equal(DecoratorType.SETTER_ACCESSOR);
  });

  it('STATIC_SETTER_ACCESSOR decorator', () => {
    class Class {
      @Decorate()
      static set accessor(param: any) {}
    }

    expect(type).to.be.equal(DecoratorType.STATIC_SETTER_ACCESSOR);
  });
});
