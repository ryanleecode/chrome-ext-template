import { APIGatewayProxyEvent, Handler } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'
import * as t from 'io-ts'

type Response = {
  headers?: Record<string, string>
  statusCode: number
  body?: string
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Credentials': 'true',
}

const optionsResponse: Response = {
  headers: {
    'Content-Type': 'text/plain',
    ...corsHeaders,
  },
  statusCode: StatusCodes.NO_CONTENT,
}

export const defaultResponse: Response = {
  headers: {
    'Content-Type': 'text/plain',
    ...corsHeaders,
  },
  statusCode: StatusCodes.METHOD_NOT_ALLOWED,
}

const TCoinDeskCurrentPriceResp = t.type({
  bpi: t.type({
    USD: t.type({
      rate_float: t.number,
    }),
  }),
})

export const errorResponse: Response = {
  statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  headers: { 'content-type': 'application/json', ...corsHeaders },
  body: JSON.stringify({
    message: 'Internal Server Error',
  }),
}

type TCoinDeskCurrentPriceResp = t.TypeOf<typeof TCoinDeskCurrentPriceResp>

export const handler: Handler<APIGatewayProxyEvent, Response> = async (
  event,
  context,
) => {
  switch (event.httpMethod) {
    case 'OPTIONS':
      return optionsResponse
    case 'GET': {
      const resp: unknown = await axios
        .get(`https://api.coindesk.com/v1/bpi/currentprice/USD.json`)
        .then((resp) => resp.data)
      const either = TCoinDeskCurrentPriceResp.decode(resp)
      switch (either._tag) {
        case 'Left':
          return errorResponse
        case 'Right': {
          const rate = either.right.bpi.USD.rate_float

          return {
            statusCode: StatusCodes.OK,
            headers: { 'content-type': 'application/json', ...corsHeaders },
            body: JSON.stringify({
              rate,
            }),
          }
        }
      }
    }
    default:
      return defaultResponse
  }
}
