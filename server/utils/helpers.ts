export function pause(dur = 5000) {
    return new Promise((resolve) => {
        setTimeout(resolve, dur);
})
}