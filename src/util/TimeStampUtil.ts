/***************************************
 * Title: TimestampUtil
 * Description: utility function on timestamps
 * Author: Wout Slabbinck (wout.slabbinck@ugent.be)
 * Created on 03/03/2022
 *****************************************/
import {DataFactory, Literal} from "n3";
import {XSD} from "../Vocabulary";
import literal = DataFactory.literal;
import namedNode = DataFactory.namedNode;

/**
 * Extract a timestamp (ms) from an RDF Literal
 * @param dateTimeLiteral
 * @returns {number}
 */
export function extractTimestampFromLiteral(dateTimeLiteral: Literal): number {
    const value = dateTimeLiteral.value;
    if (!(dateTimeLiteral.datatype && dateTimeLiteral.datatype.id === XSD.dateTime)) {
        throw Error(`Could not interpret ${dateTimeLiteral} as it was not ${XSD.dateTime}`);
    }
    const dateTime = new Date(value);
    return dateTime.getTime();
}

/**
 * Convert a timestamp (ms) to an RDF Literal
 * @param timestamp
 * @returns {Literal}
 */
export function timestampToLiteral(timestamp: number): Literal {
    const dateTime = new Date(timestamp);
    return literal(dateTime.toISOString(), namedNode(XSD.dateTime));
}

/** Convert a Date object to an RDF Literal
 * @param date
 * @returns {Literal}
 */
export function dateToLiteral(date: Date): Literal {
    return timestampToLiteral(date.getTime())
}

/**
 * Extract a Date object from an RDF Literal
 * @param dateTimeLiteral
 * @returns {Date}
 */
export function extractDateFromLiteral(dateTimeLiteral: Literal): Date {
    return new Date(extractTimestampFromLiteral(dateTimeLiteral))
}
