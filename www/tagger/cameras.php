<?php
    function prepend_slash($str) {
        return '/' . $str;
    }

    $cameras = preg_split("/\r\n|\n|\r/", trim(`ls ../ | grep 'masn'`));
    $cameras = array_map(prepend_slash, $cameras);

    echo json_encode($cameras);
?>