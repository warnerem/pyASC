const BASE_DIR = '/masn01-archive/';

let CURR_DIR = null;
let CURR_FILES = null;
let CURR_IDX = 0;

const MAX_VAL = 65535;
const POOR_LIM = MAX_VAL * (1/3);
const MEDIUM_LIM = MAX_VAL * (2/3);
const GOOD_LIM = MAX_VAL * (3/3);

$(async function() {
    $('#datepicker').prop('disabled', true);

    let result = await $.get(BASE_DIR);
    let years = getDirectories(result, /\d{4}/);

    console.log(years);

    let picker = new Pikaday({ 
        field: document.getElementById('datepicker'),
        format: 'YYYY-MM-DD',
        minDate: moment(`${years[0]}-01-01`, 'YYYY-MM-DD').toDate(),
        maxDate: moment(`${years[years.length-1]}-12-31`, 'YYYY-MM-DD').toDate(),
        onSelect: renderDate,
        onDraw: async function(evt) {
            let { year, month } = evt.calendars[0];

            let { tabs, days } = await $.get(`stats.php?y=${year}&m=${String(month + 1).padStart(2, '0')}`);

            let renderedDays = $('.pika-lendar tbody td').filter('[data-day]');
            renderedDays.each((_, elem) => {
                let dateStr = moment({
                    day: $(elem).data('day'),
                    month: month,
                    year: year
                }).format('YYYY-MM-DD');

                if (days.indexOf(dateStr) !== -1) {
                    let dateTab = tabs[days.indexOf(dateStr)];
                    $(elem).attr('data-tab', dateTab);
                    if (0 <= dateTab && dateTab < POOR_LIM) $(elem).addClass('day-poor');
                    else if (POOR_LIM <= dateTab && dateTab < MEDIUM_LIM) $(elem).addClass('day-medium');
                    else if (MEDIUM_LIM <= dateTab && dateTab < GOOD_LIM) $(elem).addClass('day-good');
                }
            });
        }
    });
    
    $('#datepicker').prop('disabled', false);

    $('#fileprev').click(function() {
        if (CURR_FILES == null) return;
        CURR_IDX = CURR_IDX - 1 < 0 ? CURR_FILES.length - 1 : CURR_IDX - 1;
        renderCurrentFile();
    });

    $('#filenext').click(function() {
        if (CURR_FILES == null) return;
        CURR_IDX = CURR_IDX + 1 >= CURR_FILES.length - 1 ? 0 : CURR_IDX + 1;
        renderCurrentFile();
    });

    $('#action-tag').click(function() {
        $('#action-tag').toggleClass('active');
        $('#tag-overlay, .tag-toggle').toggle();
        if ($('#action-tag').hasClass('active')) {
            JS9.SetZoom('ToFit');
            JS9.SetPan({ x: CENTER_PAN.ox, y: CENTER_PAN.oy });
        }
    });

    $('#tag-overlay, .tag-toggle').mousedown(evt => {
        evt.stopPropagation();
    });
});

function getDirectories(html, regex) {
    let parser = new DOMParser();
    let root = parser.parseFromString(html, 'text/html');
    let links = [].slice.call(root.getElementsByTagName('a'));
    let hrefs = links.map(link => {
        let directory = link.href.endsWith('/');
        let dest = (directory ? link.href.slice(0, -1) : link.href).split('/').pop();
        return dest.match(regex) ? dest : null;
    }).filter(e => e != null);
    return hrefs;
}

function renderCurrentFile() {
    if (CURR_FILES == null) return;
    let currentFile = CURR_FILES[CURR_IDX];
    let currPath = `${CURR_DIR}/${currentFile}`;
    
    PREV_ZOOM = null;
    PREV_PAN = null;

    $('.JS9PluginContainer').each((idx, elem) => {
        if($(elem).find('.tag-toggle, #tag-overlay').length === 0) {
            $(elem).append(`<div class='tag-toggle'></div>`);
        }
    });
    JS9.globalOpts.menuBar = ['scale'];
    JS9.globalOpts.toolBar = ['box', 'circle', 'ellipse', 'zoom+', 'zoom-', 'zoomtofit'];
    
    JS9.SetToolbar('init');
    JS9.Load(currPath, { 
        zoom: 'ToFit', 
        onload: function() {
            JS9.SetZoom('ToFit');
            CENTER_PAN = JS9.GetPan();
            console.log(CENTER_PAN);
        }
    });
    
    $('#js9-viewer').show();
    $('#actions').show();
    $('#filename').text(`${currentFile} (${CURR_IDX + 1}/${CURR_FILES.length})`);
}

async function renderDate(date) {
    $('#filename').text('Loading...');
            
    let dateStr = moment(date).format('YYYY-MM-DD');

    let yearDir = dateStr.substring(0, 4);
    let monthDir = dateStr.substring(0, 7);
    
    let parentDir = `${BASE_DIR}${yearDir}/${monthDir}/${dateStr}`
    let list = await $.get(parentDir);
    
    let entries = getDirectories(list, /\.fits?/);
    console.log(entries);
    
    CURR_IDX = 0;
    CURR_DIR = parentDir;
    CURR_FILES = entries;

    $('#skytab').show().attr('src', `${parentDir}/sky.tab.thumb.png`);

    renderCurrentFile();
}