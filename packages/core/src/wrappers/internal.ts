import { SessionStatus } from "../enums";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { thenable } from "../utils";
import { createWrapper } from "../utils/wrappers";

// TODO: check if record and def in the session should be overrided 
function useExistingWrapper(token: Token): WrapperDef {
  return (injector, session) => {
    // const newSession = session.fork();
    // newSession.setToken(token);
    // if (newSession.isAsync() === true) {
    //   return injector.getAsync(token, undefined, newSession);
    // }
    // return injector.get(token, undefined, newSession);
    session.setToken(token);
    return injector.get(token, undefined, session);
  }
}

export const UseExisting = createWrapper<Token, true>(useExistingWrapper);

function internalWrapper(inject: 'session' | 'record' | 'definition' | 'instance'): WrapperDef {
  switch (inject) {
    case 'session': {
      return (injector, session, next) => {
        return thenable(
          () => next(injector, session),
          value => [value, session],
        );
      }
    };
    case 'instance': {
      return (injector, session, next) => {
        return thenable(
          () => next(injector, session),
          value => [value, session.instance],
        );
      }
    };
    case 'definition': {
      return (injector, session, next) => {
        if (session.definition) return session.definition;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(injector, session),
          value => [value, session.definition],
        );
      }
    };
    case 'record': {
      return (injector, session, next) => {
        if (session.record) return session.record;
        // annotate session as dry run
        session.status |= SessionStatus.DRY_RUN;
        return thenable(
          () => next(injector, session),
          value => [value, session.record],
        );
      }
    };
  }
}

export const Internal = createWrapper<'session' | 'record' | 'definition' | 'instance', true>(internalWrapper);


const lol = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "http://asyncapi.com/bindings/solace/operation.json",
  "title": "Operation Schema",
  "description": "This object contains information about the operation representation in Solace.",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "bindings": {
      "description": "The inner bindings",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "deliveryMode": {
            "type": "string",
            "enum": [
              "direct",
              "persistent"
            ]
          }
        },
        "oneOf": [
          {
            "properties": {
              "destinationType": {
                "type": "string",
                "const": "queue",
                "description": "If the type is queue, then the subscriber can bind to the queue, which in turn will subscribe to the topic as represented by the channel name."
              },
              "queue": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "description": "The name of the queue"
                  },
                  "topicSubscriptions": {
                    "type": "array",
                    "description": "The list of topics that the queue subscribes to.",
                    "items": {
                      "type": "string"
                    }
                  },
                  "exclusive": {
                    "type": "boolean"
                  }
                }
              }
            }
          },
          {
            "properties": {
              "destinationType": {
                "type": "string",
                "const": "topic",
                "description": "If the type is queue, then the subscriber can bind to the queue, which in turn will subscribe to the topic as represented by the channel name."
              }
            }
          }
        ]
      }
    },
    "bindingVersion": {
      "type": "string",
      "enum": [
        "0.2.0"
      ],
      "description": "The version of this binding. If omitted, \"latest\" MUST be assumed."
    }
  },
  "examples": [
    {
      "bindingVersion": "0.2.0",
      "bindings": [
        {
          "destinationType": "queue",
          "queue": {
            "name": "sampleQueue",
            "topicSubscriptions": [
              "samples/*"
            ],
            "exclusive": false
          }
        },
        {
          "destinationType": "topic",
          "deliveryMode": "persistent"
        }
      ]
    }
  ]
}