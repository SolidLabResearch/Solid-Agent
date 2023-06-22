import {CronJob} from "cron";

async function main() {
    const currentTime = new Date()
    const future = new Date(currentTime.valueOf()+1*1000)
    // const test = sendAt(new Date(future))
    const toFireFunction = () => console.log("function fired at ", new Date().toISOString())
    // const onComplete = () => {
    //     console.log("Function completed at ", new Date().toISOString())
    // }
    const job = new CronJob(future, toFireFunction)
    job.start()
    console.log("now:", currentTime.toISOString())
    console.log("cronJob should fire at:", future.toISOString())
    console.log("According to the job, it fires at", job.nextDate().toISO())
}
main()
