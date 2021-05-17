import {
    LoggerInterface,
    ConnectionData,
    LoggerServerStatusData,
} from "typedapi-server"
import {
    JsonEncoderInterface,
} from "typedapi-core"
import * as http from "http"

export class AnalyticsLogger implements LoggerInterface {

    constructor(
        private host: string,
        private port: number,
        private node: string = "core",
        private jsonEncoder: JsonEncoderInterface = JSON
    ) { }

    methodCall(method: string, ms: number, input: unknown, output: unknown, connectionData: ConnectionData): void {
        this.send({
            type: "methodCall",
            node: this.node,
            data: {
                method,
                ms,
                input,
                output,
                connectionData,
            }
        })
    }

    clientError(method: string, input: unknown, error: string, connectionData: ConnectionData): void {
        this.send({
            type: "clientError",
            node: this.node,
            data: {
                method,
                input,
                error,
                connectionData,
            }
        })
    }

    serverError(method: string, input: unknown, error: string, connectionData: ConnectionData): void {
        this.send({
            type: "serverError",
            node: this.node,
            data: {
                method,
                input,
                error,
                connectionData
            }
        })
    }

    event(event: string, data: unknown, connectionData?: ConnectionData): void {
        this.send({
            type: "event",
            node: this.node,
            data: {
                event,
                data,
                connectionData,
            }
        })
    }

    status(data: LoggerServerStatusData): void {
        this.send({
            type: "status",
            node: this.node,
            data
        })
    }

    send(data: unknown) {        
        const body = this.jsonEncoder.stringify(data)
        const request = http.request({
            host: this.host,
            port: this.port,
            path: "/",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": body.length,
            },
        }, response => {
            if (response.statusCode !== 200) {
                console.error(`Analytics bad response: ${response.statusCode} ${response.statusMessage}`)
                return
            }
            response.on("error", err => {
                console.error(`Analytics response error`)
                console.error(err)
            })
        })
        request.on("error", err => console.error(err))
        request.end(body)
    }

}